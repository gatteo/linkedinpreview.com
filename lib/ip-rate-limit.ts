interface RateLimitOptions {
    // A namespace so multiple endpoints can share this module without colliding.
    id: string
    limit: number
    windowMs: number
}

interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: number
}

// Best-effort, per-instance sliding-window limiter backed by an in-memory Map.
// This is a backstop only - serverless instances do not share memory, so a
// production-grade limit needs a persistent store (e.g. Redis/Upstash).
const hits = new Map<string, number[]>()

function getClientIp(request: Request): string {
    // Prefer the platform-trusted header. On Vercel this is set by the edge and is
    // harder to spoof than a client-supplied x-forwarded-for (whose leftmost value
    // a caller can rotate to dodge the bucket).
    const vercel = request.headers.get('x-vercel-forwarded-for')?.trim()
    if (vercel) return vercel
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim()
        if (first) return first
    }
    return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

export function checkIpRateLimit(request: Request, { id, limit, windowMs }: RateLimitOptions): RateLimitResult {
    if (process.env.NODE_ENV === 'development') {
        return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs }
    }

    const ip = getClientIp(request)
    const key = `${id}:${ip}`
    const now = Date.now()
    const windowStart = now - windowMs

    const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart)

    if (timestamps.length >= limit) {
        const resetAt = timestamps[0] + windowMs
        hits.set(key, timestamps)
        return { allowed: false, remaining: 0, resetAt }
    }

    timestamps.push(now)
    hits.set(key, timestamps)

    // Opportunistically prune other expired entries to bound memory growth.
    if (hits.size > 5000) {
        for (const [k, v] of hits) {
            const live = v.filter((t) => t > windowStart)
            if (live.length === 0) hits.delete(k)
            else hits.set(k, live)
        }
    }

    return { allowed: true, remaining: limit - timestamps.length, resetAt: now + windowMs }
}
