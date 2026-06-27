import { LinkPreviewError } from './errors'
import { assertHostAllowed, resolveAndCheck, validateUrl } from './ssrf'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const TIMEOUT_MS = 8000
const MAX_REDIRECTS = 5
const USER_AGENT = 'Mozilla/5.0 (compatible; LinkedInBot/1.0; +https://www.linkedin.com)'

export interface FetchHtmlResult {
    html: string
    finalUrl: string
    status: number
    contentType: string
}

// Validate the destination, then fetch it. Host validation runs on every hop so
// redirects cannot smuggle us to an internal address.
//
// KNOWN RESIDUAL (accepted for this build-lean launch): resolveAndCheck and fetch()
// resolve DNS independently, so an attacker who controls authoritative DNS with a
// near-zero TTL could pass the check with a public IP and then have fetch() connect
// to an internal IP (a DNS-rebinding TOCTOU). Fully closing it means pinning the
// validated IP for the connection (an undici dispatcher with a custom lookup). On
// Vercel/Lambda the blast radius is limited (IMDS is not exposed to functions), so
// this is documented and deferred rather than fixed here.
async function guardedFetch(url: URL, signal: AbortSignal): Promise<Response> {
    assertHostAllowed(url.hostname)
    await resolveAndCheck(url.hostname)

    try {
        return await fetch(url, {
            method: 'GET',
            redirect: 'manual',
            signal,
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml',
            },
        })
    } catch (err) {
        if (err instanceof LinkPreviewError) throw err
        if ((err as Error)?.name === 'AbortError') {
            throw new LinkPreviewError('timeout', 'The page took too long to respond.')
        }
        throw new LinkPreviewError('fetch-failed', 'We could not load that page.')
    }
}

function detectCharset(contentType: string): string {
    const match = contentType.match(/charset=([^;]+)/i)
    if (!match) return 'utf-8'
    return match[1].trim().replace(/['"]/g, '').toLowerCase() || 'utf-8'
}

function decode(bytes: Uint8Array, charset: string): string {
    try {
        return new TextDecoder(charset).decode(bytes)
    } catch {
        return new TextDecoder('utf-8').decode(bytes)
    }
}

export async function fetchHtml(rawUrl: string): Promise<FetchHtmlResult> {
    let current = validateUrl(rawUrl)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
        let response: Response | null = null

        for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
            response = await guardedFetch(current, controller.signal)

            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get('location')
                await response.body?.cancel()

                if (!location) break // redirect without a target - treat as final

                if (redirects === MAX_REDIRECTS) {
                    throw new LinkPreviewError('fetch-failed', 'That page redirected too many times.')
                }

                let next: URL
                try {
                    next = new URL(location, current)
                } catch {
                    throw new LinkPreviewError('fetch-failed', 'That page redirected to an invalid URL.')
                }

                current = validateUrl(next.toString())
                continue
            }

            break
        }

        if (!response) {
            throw new LinkPreviewError('fetch-failed', 'We could not load that page.')
        }

        const contentType = response.headers.get('content-type') ?? ''
        const finalUrl = current.toString()
        const status = response.status

        // Only parse markup. Non-html (images, pdf, json, etc.) returns empty html.
        const lowerType = contentType.toLowerCase()
        const isHtmlLike = lowerType === '' || lowerType.includes('html') || lowerType.includes('xml')
        if (!isHtmlLike) {
            await response.body?.cancel()
            return { html: '', finalUrl, status, contentType }
        }

        const reader = response.body?.getReader()
        if (!reader) {
            return { html: '', finalUrl, status, contentType }
        }

        const chunks: Uint8Array[] = []
        let received = 0
        try {
            for (;;) {
                const { done, value } = await reader.read()
                if (done) break
                if (value) {
                    received += value.length
                    if (received > MAX_BYTES) {
                        await reader.cancel()
                        throw new LinkPreviewError('too-large', 'That page is too large to analyze.')
                    }
                    chunks.push(value)
                }
            }
        } catch (err) {
            if (err instanceof LinkPreviewError) throw err
            if ((err as Error)?.name === 'AbortError') {
                throw new LinkPreviewError('timeout', 'The page took too long to respond.')
            }
            throw new LinkPreviewError('fetch-failed', 'We could not read that page.')
        }

        const total = new Uint8Array(received)
        let offset = 0
        for (const chunk of chunks) {
            total.set(chunk, offset)
            offset += chunk.length
        }

        const html = decode(total, detectCharset(contentType))
        return { html, finalUrl, status, contentType }
    } finally {
        clearTimeout(timer)
    }
}
