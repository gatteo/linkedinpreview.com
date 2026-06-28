/**
 * Lightweight, build-lean abuse guards for the public AI endpoints.
 *
 * These are best-effort backstops, NOT a substitute for real protection. The
 * generator page makes these endpoints indexable and ungated, so the goal here
 * is to raise the cost of casual scraping without adding infrastructure. The
 * authoritative limit remains the per-user Supabase rate limit.
 */

function forbidden(): Response {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
    })
}

/**
 * Reject cross-origin requests by comparing the Origin (or Referer) host to the
 * request host.
 *
 * KNOWN WEAK SPOT: if neither an Origin nor a Referer header is present, the
 * request is allowed. A scraper can trivially omit both headers, so this only
 * stops naive cross-site calls from a browser. The IP rate limit and per-user
 * auth are the real backstops. In development we never block.
 */
export function assertSameOrigin(request: Request): Response | null {
    if (process.env.NODE_ENV === 'development') return null

    const host = request.headers.get('host')
    const source = request.headers.get('origin') ?? request.headers.get('referer')

    // No host or no Origin/Referer to compare against - allow (documented weak spot).
    if (!host || !source) return null

    let sourceHost: string
    try {
        sourceHost = new URL(source).host
    } catch {
        // Malformed Origin/Referer - treat as a mismatch and block.
        return forbidden()
    }

    if (sourceHost !== host) return forbidden()

    return null
}

interface IpRateLimitOptions {
    id: string
    limit: number
    windowMs: number
}

interface IpRateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: string
}

// Map of `${id}:${ip}` -> array of absolute expiry timestamps (ms). Storing each
// hit's own expiry keeps the global prune correct regardless of window size.
//
// BEST-EFFORT ONLY: this lives in module memory, so it resets on cold start and
// is per-instance. Serverless runs many instances, so a persistent store
// (Upstash/Redis) is the production upgrade. This just blunts a burst from a
// single IP hitting one warm instance.
const ipHits = new Map<string, number[]>()

function getClientIp(request: Request): string {
    // Prefer the platform-trusted header (Vercel sets x-vercel-forwarded-for at the
    // edge; harder to spoof than a client-supplied x-forwarded-for).
    const vercel = request.headers.get('x-vercel-forwarded-for')?.trim()
    if (vercel) return vercel
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim()
        if (first) return first
    }
    return request.headers.get('x-real-ip') ?? 'unknown'
}

export function checkIpRateLimit(request: Request, { id, limit, windowMs }: IpRateLimitOptions): IpRateLimitResult {
    if (process.env.NODE_ENV === 'development') {
        return { allowed: true, remaining: limit, resetAt: new Date(Date.now() + windowMs).toISOString() }
    }

    const now = Date.now()
    const key = `${id}:${getClientIp(request)}`

    // Global prune: drop expired hits so the map stays bounded.
    for (const [k, expiries] of ipHits) {
        const fresh = expiries.filter((e) => e > now)
        if (fresh.length === 0) ipHits.delete(k)
        else ipHits.set(k, fresh)
    }

    const expiries = ipHits.get(key) ?? []

    if (expiries.length >= limit) {
        return { allowed: false, remaining: 0, resetAt: new Date(Math.min(...expiries)).toISOString() }
    }

    expiries.push(now + windowMs)
    ipHits.set(key, expiries)

    return { allowed: true, remaining: limit - expiries.length, resetAt: new Date(Math.min(...expiries)).toISOString() }
}
