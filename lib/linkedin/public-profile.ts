import { env } from '@/env.mjs'

import { normalizeProfileUrl } from './profile-url'

export { isLikelyProfileUrl, normalizeProfileUrl } from './profile-url'

// ---------------------------------------------------------------------------
// FAST public LinkedIn profile fetch + parse (the live onboarding tier).
//
// Two providers, tried in order, both synchronous within seconds:
//   1. Scrapingdog's dedicated LinkedIn profile API (structured JSON, ~3-8s) -
//      the production-reliable path; set SCRAPINGDOG_API_KEY to enable.
//   2. LinkedIn's own SEO page: JSON-LD `@graph` (Person + Article nodes) and
//      Open Graph tags. Works from residential IPs (local dev); LinkedIn
//      near-universally blocks datacenter IPs (Vercel), so in production this
//      usually returns a challenge page. LINKEDIN_SCRAPE_API_URL can route it
//      through a raw-HTML proxy instead.
//
// The RICH tier (Bright Data dataset: full posts + followers, async 42-60s)
// lives in lib/linkedin/rich-scrape.ts - it can never serve a live screen, so
// it is triggered/polled separately and must not be called from here.
//
// Everything degrades to `{ found: false }` - callers fall back to manual setup.
// Scraping public profiles is a LinkedIn ToS gray area; this only reads public,
// member-published data and never authenticates as the member.
// ---------------------------------------------------------------------------

export type FastProfileSource = 'scrapingdog' | 'jsonld' | 'none'

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
    /** Which provider produced the data. */
    source: FastProfileSource
    /** The complete provider record (Scrapingdog only), persisted for analysis. */
    raw?: Record<string, unknown>
}

const EMPTY: PublicProfile = {
    found: false,
    name: '',
    headline: '',
    about: '',
    recentPosts: [],
    avatarUrl: '',
    url: '',
    source: 'none',
}

const FETCH_TIMEOUT_MS = 12_000
const SCRAPINGDOG_TIMEOUT_MS = 9_000
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
    return { found, name, headline, about, recentPosts, avatarUrl, url, source: 'jsonld' }
}

// --- Scrapingdog path (preferred when configured) ---------------------------
//
// Dedicated LinkedIn profile endpoint: synchronous structured JSON keyed by the
// profile's vanity slug. Field names vary slightly across their plans/versions,
// so the mapping is deliberately defensive. Never throws - returns null so we
// fall through to the JSON-LD path.

type ScrapingdogArticle = { title?: string; link?: string }
type ScrapingdogActivity = { title?: string; activity?: string; link?: string }

type ScrapingdogProfile = {
    fullName?: string
    full_name?: string
    first_name?: string
    last_name?: string
    headline?: string
    about?: string
    summary?: string
    profile_photo?: string
    profile_photo_url?: string
    articles?: ScrapingdogArticle[]
    activities?: ScrapingdogActivity[]
}

async function fetchViaScrapingdog(targetUrl: string, signal: AbortSignal): Promise<PublicProfile | null> {
    const apiKey = env.SCRAPINGDOG_API_KEY
    if (!apiKey) return null
    const slug = targetUrl.split('/in/')[1]?.replace(/\/+$/, '')
    if (!slug) return null

    // Own timeout on top of the caller's overall budget so a slow Scrapingdog
    // response still leaves time for the JSON-LD fallback.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), SCRAPINGDOG_TIMEOUT_MS)
    const onAbort = () => controller.abort()
    signal.addEventListener('abort', onAbort)
    try {
        // NB: the profile parameter is `linkId` (validated live) - `id` returns
        // a 404 "Not a valid Linkedin Id".
        const endpoint = `https://api.scrapingdog.com/linkedin?api_key=${encodeURIComponent(apiKey)}&type=profile&linkId=${encodeURIComponent(slug)}&private=false`
        const res = await fetch(endpoint, { signal: controller.signal })
        if (!res.ok) return null
        const body = (await res.json()) as ScrapingdogProfile | ScrapingdogProfile[]
        const record = Array.isArray(body) ? body[0] : body
        if (!record || typeof record !== 'object') return null

        const name = (
            record.fullName ||
            record.full_name ||
            [record.first_name, record.last_name].filter(Boolean).join(' ')
        ).trim()
        const headline = (record.headline ?? '').trim()
        const about = (record.about || record.summary || '').trim()
        const avatarUrl = (record.profile_photo || record.profile_photo_url || '').trim()
        const recentPosts = Array.from(
            new Set(
                [...(record.articles ?? []), ...(record.activities ?? [])]
                    .map((a) => (a.title ?? '').trim())
                    .filter(Boolean),
            ),
        ).slice(0, MAX_POSTS)

        const found = Boolean(name || headline || about || recentPosts.length)
        if (!found) return null
        return {
            found,
            name,
            headline,
            about,
            recentPosts,
            avatarUrl,
            url: targetUrl,
            source: 'scrapingdog',
            raw: record as Record<string, unknown>,
        }
    } catch {
        return null
    } finally {
        clearTimeout(timer)
        signal.removeEventListener('abort', onAbort)
    }
}

/**
 * Get the profile page HTML. Routes through a configured scraping API when set
 * (a raw-HTML proxy), otherwise fetches directly (works from residential IPs /
 * local dev, often blocked from datacenter IPs).
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
 * Fetch and parse a public LinkedIn profile via the fast tier. Never throws -
 * returns `{ found: false }` on a bad URL, a block/auth-wall, a timeout, or a
 * parse miss so the caller can fall back to manual setup.
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
        const viaScrapingdog = await fetchViaScrapingdog(url, controller.signal)
        if (viaScrapingdog?.found) return viaScrapingdog

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
