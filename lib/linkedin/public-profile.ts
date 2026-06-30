import { env } from '@/env.mjs'

import { normalizeProfileUrl } from './profile-url'

export { isLikelyProfileUrl, normalizeProfileUrl } from './profile-url'

// ---------------------------------------------------------------------------
// Public LinkedIn profile fetch + parse.
//
// LinkedIn renders an SEO version of every public profile that embeds a
// JSON-LD `@graph` (a `Person` node with name/jobTitle/description plus recent
// `Article`/`DiscussionForumPosting` nodes) and Open Graph meta tags. We fetch
// that page server-side and parse those, which gives a REAL signal - the
// member's headline, about, and recent post titles (how they actually write) -
// that the OAuth/userinfo identity (name + photo only) cannot.
//
// Reality check (why this is best-effort, not guaranteed):
//   - LinkedIn serves this page to some unauthenticated requests but
//     near-universally blocks datacenter IPs (AWS/GCP/Vercel) by ASN. From a
//     residential IP (local dev) it usually works; from serverless it often
//     returns a challenge/auth-wall. We therefore degrade gracefully to
//     `{ found: false }` and the caller falls back to manual setup.
//   - For reliable production fetching, set LINKEDIN_SCRAPE_API_URL (+ KEY) to
//     route through a residential-proxy / scraping API that returns raw HTML.
//   - Scraping public profiles is a LinkedIn ToS gray area; this only reads
//     public, member-published data and never authenticates as the member.
// ---------------------------------------------------------------------------

export type PublicProfile = {
    /** Whether we extracted any usable signal from the page. */
    found: boolean
    name: string
    /** The LinkedIn tagline (e.g. "Founder at Acme · ex-Stripe"). */
    headline: string
    /** The "About" summary, when public. */
    about: string
    /** Recent post / article titles - a sample of what and how they write. */
    recentPosts: string[]
    avatarUrl: string
    /** The canonical profile URL we resolved and fetched. */
    url: string
}

const EMPTY: PublicProfile = {
    found: false,
    name: '',
    headline: '',
    about: '',
    recentPosts: [],
    avatarUrl: '',
    url: '',
}

const FETCH_TIMEOUT_MS = 10_000
const MAX_HTML_BYTES = 5_000_000
const MAX_POSTS = 8

// A real desktop browser UA - LinkedIn serves the SEO page to these, not to
// obvious bots/scrapers.
const BROWSER_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function decodeEntities(s: string): string {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;|&#x27;|&apos;/gi, "'")
        .replace(/&#x2F;/gi, '/')
        .replace(/&nbsp;/g, ' ')
}

function metaContent(html: string, property: string): string {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*>`, 'i')
    const tag = html.match(re)?.[0]
    if (!tag) return ''
    const content = tag.match(/content=["']([^"']*)["']/i)?.[1] ?? ''
    return decodeEntities(content).trim()
}

type LdNode = {
    '@type'?: string | string[]
    'name'?: string
    'headline'?: string
    'jobTitle'?: string | string[]
    'description'?: string
    'image'?: { contentUrl?: string; url?: string } | string
}

function typeOf(node: LdNode): string[] {
    const t = node['@type']
    return Array.isArray(t) ? t : t ? [t] : []
}

function parseJsonLd(html: string): LdNode[] {
    const nodes: LdNode[] = []
    const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    for (const block of blocks) {
        const rawJson = block[1]?.trim()
        if (!rawJson) continue
        try {
            const parsed = JSON.parse(decodeEntities(rawJson))
            const graph = Array.isArray(parsed) ? parsed : Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed]
            for (const n of graph) if (n && typeof n === 'object') nodes.push(n as LdNode)
        } catch {
            // A malformed block is not fatal; other extraction paths still run.
        }
    }
    return nodes
}

/** Extract a structured profile from the page HTML. */
export function parsePublicProfileHtml(html: string, url: string): PublicProfile {
    const nodes = parseJsonLd(html)
    const person = nodes.find((n) => typeOf(n).includes('Person'))

    const ogTitle = metaContent(html, 'og:title')
    // og:title is "Name - Headline | LinkedIn"
    const titleCore = ogTitle.replace(/\s*\|\s*LinkedIn\s*$/i, '')
    const dashIdx = titleCore.indexOf(' - ')
    const titleName = dashIdx > 0 ? titleCore.slice(0, dashIdx).trim() : titleCore.trim()
    const titleHeadline = dashIdx > 0 ? titleCore.slice(dashIdx + 3).trim() : ''

    const jobTitles = person?.jobTitle
        ? (Array.isArray(person.jobTitle) ? person.jobTitle : [person.jobTitle]).filter(Boolean)
        : []

    const name = (person?.name || titleName || '').trim()
    const headline = (titleHeadline || jobTitles.join(', ') || '').trim()
    const about = (person?.description || metaContent(html, 'og:description') || '').trim()

    const recentPosts = Array.from(
        new Set(
            nodes
                .filter((n) => typeOf(n).some((t) => t === 'Article' || t === 'DiscussionForumPosting'))
                .map((n) => (n.headline || n.name || '').trim())
                .filter((h) => h.length > 0),
        ),
    ).slice(0, MAX_POSTS)

    const ogImage = metaContent(html, 'og:image')
    const personImage =
        person && typeof person.image === 'object'
            ? (person.image.contentUrl ?? person.image.url ?? '')
            : typeof person?.image === 'string'
              ? person.image
              : ''
    const avatarUrl = (ogImage || personImage || '').trim()

    const found = Boolean(name || headline || about || recentPosts.length)
    return { found, name, headline, about, recentPosts, avatarUrl, url }
}

/**
 * Get the profile page HTML. Routes through a configured scraping API when set
 * (the production-reliable path), otherwise fetches directly (works from
 * residential IPs / local dev, often blocked from datacenter IPs).
 */
async function getProfileHtml(targetUrl: string, signal: AbortSignal): Promise<string | null> {
    const scrapeApi = env.LINKEDIN_SCRAPE_API_URL
    const requestUrl = scrapeApi
        ? `${scrapeApi}${scrapeApi.includes('?') ? '&' : '?'}url=${encodeURIComponent(targetUrl)}`
        : targetUrl

    const headers: Record<string, string> = scrapeApi
        ? env.LINKEDIN_SCRAPE_API_KEY
            ? { Authorization: `Bearer ${env.LINKEDIN_SCRAPE_API_KEY}` }
            : {}
        : { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9', 'Accept': 'text/html' }

    const res = await fetch(requestUrl, { headers, redirect: 'follow', signal })
    if (!res.ok) return null

    // Best-effort size guard. A declared-too-large body is rejected up front;
    // otherwise we cap after buffering (the abort timeout bounds a slow stream).
    const len = Number(res.headers.get('content-length') ?? 0)
    if (len && len > MAX_HTML_BYTES) return null
    const html = await res.text()
    return html.length > MAX_HTML_BYTES ? html.slice(0, MAX_HTML_BYTES) : html
}

/**
 * Fetch and parse a public LinkedIn profile. Never throws - returns
 * `{ found: false }` on a bad URL, a block/auth-wall, a timeout, or a parse miss
 * so the caller can fall back to manual setup.
 */
export async function fetchPublicProfile(
    input: string | undefined | null,
    externalSignal?: AbortSignal,
): Promise<PublicProfile> {
    const url = normalizeProfileUrl(input)
    if (!url) return EMPTY

    // Abort on either our own timeout or the caller's signal (e.g. client
    // disconnect), so a request abort cancels the whole fetch chain.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const onExternalAbort = () => controller.abort()
    externalSignal?.addEventListener('abort', onExternalAbort)
    try {
        const html = await getProfileHtml(url, controller.signal)
        if (!html) return { ...EMPTY, url }
        const profile = parsePublicProfileHtml(html, url)
        return profile.found ? profile : { ...EMPTY, url }
    } catch {
        return { ...EMPTY, url }
    } finally {
        clearTimeout(timer)
        externalSignal?.removeEventListener('abort', onExternalAbort)
    }
}
