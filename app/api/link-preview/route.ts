import { z } from 'zod'

import { checkIpRateLimit } from '@/lib/ip-rate-limit'
import { analyze } from '@/lib/link-preview/analyze'
import { LinkPreviewError, type LinkPreviewErrorCode } from '@/lib/link-preview/errors'
import { fetchHtml } from '@/lib/link-preview/fetch-og'
import { parseMeta } from '@/lib/link-preview/parse-meta'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
    url: z.string().min(1, 'Please enter a URL').max(2048, 'That URL is too long'),
})

const ERROR_STATUS: Record<LinkPreviewErrorCode, number> = {
    'invalid-url': 400,
    'blocked': 422,
    'fetch-failed': 422,
    'timeout': 504,
    'too-large': 413,
}

function json(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

// Reject cross-origin POSTs so the endpoint is not trivially used as an open
// proxy from other sites. Skipped in development for local tooling.
function isSameOrigin(request: Request): boolean {
    if (process.env.NODE_ENV === 'development') return true

    const requestHost = request.headers.get('host')
    const origin = request.headers.get('origin') ?? request.headers.get('referer')
    if (!origin) return true // no Origin/Referer (e.g. server-to-server) - allow

    try {
        return new URL(origin).host === requestHost
    } catch {
        return false
    }
}

export async function POST(request: Request) {
    if (!isSameOrigin(request)) {
        return json({ error: 'Cross-origin requests are not allowed.' }, 403)
    }

    const rateLimit = checkIpRateLimit(request, { id: 'link-preview', limit: 20, windowMs: 5 * 60 * 1000 })
    if (!rateLimit.allowed) {
        return json({ error: 'Too many requests. Please wait a few minutes and try again.' }, 429)
    }

    let raw: unknown
    try {
        raw = await request.json()
    } catch {
        return json({ error: 'Invalid JSON body' }, 400)
    }

    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
        return json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400)
    }

    try {
        const { html, finalUrl, status } = await fetchHtml(parsed.data.url)
        const { data, hadAnyOgTags } = parseMeta(html, parsed.data.url, finalUrl)
        // Only treat absent OG tags as a JS-rendering signal when we actually got HTML back.
        const fetchedHtml = status === 200 && html.length > 0
        const issues = analyze(data, { hadAnyOgTags: hadAnyOgTags || !fetchedHtml })

        return json({ data, issues }, 200)
    } catch (err) {
        if (err instanceof LinkPreviewError) {
            return json({ error: err.message }, ERROR_STATUS[err.code])
        }
        // Never leak internal details from unexpected errors.
        return json({ error: 'We could not analyze that link. Please try again.' }, 422)
    }
}
