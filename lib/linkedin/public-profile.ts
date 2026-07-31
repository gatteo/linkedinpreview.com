import { env } from '@/env.mjs'
import type { FastIdentity } from '@/types/onboarding'

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
//      near-universally blocks datacenter IPs (Vercel) with an HTTP 999, so in
//      production this needs BRIGHTDATA_UNLOCKER_ZONE or LINKEDIN_SCRAPE_API_URL
//      configured to route through a residential proxy - without either set,
//      this tier is unreachable from Vercel, confirmed in production logs.
//
// Each tier gets its OWN timeout budget (SCRAPINGDOG_TIMEOUT_MS / FALLBACK_TIMEOUT_MS)
// so a slow/timed-out Scrapingdog call never starves the fallback's time to run.
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
    /** Extended identity (Scrapingdog only) for the onboarding profile card. */
    identity?: FastIdentity
    /**
     * Why the fast tier produced nothing (only set when `found` is false):
     * `http-<status>` (e.g. quota 402 / rate-limit 429), `empty-record` (a 200
     * with no usable fields - Scrapingdog's own scrape failed), `timeout`,
     * `network`, `parse`, `no-key`, or `html-block` (jsonld tier unreachable).
     * Threaded onto `onb_enrich_result` so a silent degrade is diagnosable.
     */
    failReason?: string
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

// 9s here was the single largest source of onboarding fetch failures: three
// quarters of all `onb_fetch_failed` events were `reason='timeout'`, which has
// exactly one source - this controller aborting because Scrapingdog had not
// answered yet. The profile is the whole basis of a personalized audit, so
// waiting longer beats degrading to a generic one.
const SCRAPINGDOG_TIMEOUT_MS = 18_000
// The JSON-LD/Bright Data fallback gets this as its OWN full window - it must
// never inherit whatever time Scrapingdog's own timeout already spent (see
// fetchPublicProfile below).
const FALLBACK_TIMEOUT_MS = 8_000
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
    public_identifier?: string
    headline?: string
    about?: string
    summary?: string
    location?: string
    followers?: string
    connections?: string
    profile_photo?: string
    profile_photo_url?: string
    background_cover_image_url?: string
    articles?: ScrapingdogArticle[]
    activities?: ScrapingdogActivity[]
    experience?: { company_name?: string; company_image?: string }[]
    education?: { college_name?: string }[]
    languages?: { name?: string; level?: string }[]
    awards?: { name?: string }[]
}

const MAX_EXPERIENCE = 3
const MAX_AWARDS = 3

/** Title-case a provider string that often arrives lowercased ("mia platform"). */
function titleCase(s: string): string {
    return s.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}

/**
 * The extended identity for the onboarding profile card. Every field is
 * optional - Scrapingdog omits or empties fields freely, and the card hides
 * missing rows rather than showing blanks.
 */
function extractIdentity(record: ScrapingdogProfile): FastIdentity {
    const identity: FastIdentity = {}
    const location = (record.location ?? '').trim()
    if (location) identity.location = location
    const cover = (record.background_cover_image_url ?? '').trim()
    if (cover) identity.coverUrl = cover
    const publicId = (record.public_identifier ?? '').trim()
    if (publicId) identity.publicId = publicId
    // "3K followers" / "500+ connections" -> keep just the count label.
    const followers = (record.followers ?? '').replace(/followers?/i, '').trim()
    if (followers) identity.followersLabel = followers
    const connections = (record.connections ?? '').replace(/connections?/i, '').trim()
    if (connections) identity.connectionsLabel = connections
    const languages = (record.languages ?? [])
        .map((l) => ({ name: (l.name ?? '').trim(), level: (l.level ?? '').trim() }))
        .filter((l) => l.name)
    if (languages.length) identity.languages = languages
    const experience = (record.experience ?? [])
        .map((e) => ({ name: titleCase((e.company_name ?? '').trim()), logoUrl: (e.company_image ?? '').trim() }))
        .filter((e) => e.name)
        .slice(0, MAX_EXPERIENCE)
    if (experience.length) identity.experience = experience
    const education = (record.education ?? []).map((e) => titleCase((e.college_name ?? '').trim())).find((name) => name)
    if (education) identity.education = education
    const awards = (record.awards ?? [])
        .map((a) => (a.name ?? '').trim())
        .filter(Boolean)
        .slice(0, MAX_AWARDS)
    if (awards.length) identity.awards = awards
    return identity
}

// Returns the profile on success, or a `reason` on failure so the caller can
// thread WHY the fast tier produced nothing onto the funnel event - a bare null
// hid quota (402/403), rate-limit (429), timeouts, and empty scrapes behind one
// silent 'none', making the launch-week degradation undiagnosable.
type ScrapingdogResult = { profile: PublicProfile | null; reason: string | null }

async function fetchViaScrapingdog(targetUrl: string, signal: AbortSignal): Promise<ScrapingdogResult> {
    const apiKey = env.SCRAPINGDOG_API_KEY
    if (!apiKey) return { profile: null, reason: 'no-key' }
    const slug = targetUrl.split('/in/')[1]?.replace(/\/+$/, '')
    if (!slug) return { profile: null, reason: 'bad-slug' }

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
        if (!res.ok) {
            // 402/403 = credits/plan exhausted, 429 = rate-limited, 5xx =
            // Scrapingdog trouble. Logged so the actual mode is visible in Vercel.
            console.error(`[enrich] scrapingdog http ${res.status} for /in/${slug}`)
            return { profile: null, reason: `http-${res.status}` }
        }
        const body = (await res.json()) as ScrapingdogProfile | ScrapingdogProfile[]
        const record = Array.isArray(body) ? body[0] : body
        if (!record || typeof record !== 'object') {
            console.warn(`[enrich] scrapingdog empty body for /in/${slug}`)
            return { profile: null, reason: 'empty-record' }
        }

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
        if (!found) {
            // A 200 whose record carried no usable fields: Scrapingdog's own
            // scrape of LinkedIn came back thin (the fast-growing failure mode as
            // LinkedIn tightens anti-bot), distinct from an HTTP error.
            console.warn(`[enrich] scrapingdog no usable fields for /in/${slug}`)
            return { profile: null, reason: 'empty-record' }
        }
        return {
            profile: {
                found,
                name,
                headline,
                about,
                recentPosts,
                avatarUrl,
                url: targetUrl,
                source: 'scrapingdog',
                raw: record as Record<string, unknown>,
                identity: extractIdentity(record),
            },
            reason: null,
        }
    } catch (err) {
        // The caller's signal aborting cancels the whole chain (client left);
        // our own controller aborting is the Scrapingdog timeout.
        const reason = signal.aborted
            ? 'aborted'
            : controller.signal.aborted
              ? 'timeout'
              : err instanceof SyntaxError
                ? 'parse'
                : 'network'
        console.error(`[enrich] scrapingdog ${reason} for /in/${slug}`, err)
        return { profile: null, reason }
    } finally {
        clearTimeout(timer)
        signal.removeEventListener('abort', onAbort)
    }
}

const MAX_HTML_CAP = (html: string) => (html.length > MAX_HTML_BYTES ? html.slice(0, MAX_HTML_BYTES) : html)

/**
 * Bright Data Web Unlocker (native API): POST the target URL to /request with a
 * configured zone and `format: raw`, and it returns the unblocked page HTML from
 * a residential IP - the way to reach LinkedIn's SEO page from Vercel's
 * datacenter IP (which LinkedIn 999-blocks). Reuses BRIGHTDATA_API_KEY (same
 * token as the rich dataset tier); the zone is created in the Bright Data
 * dashboard and named via BRIGHTDATA_UNLOCKER_ZONE. Null (never throws) so the
 * caller falls through to the generic proxy / direct fetch.
 */
async function fetchViaBrightDataUnlocker(targetUrl: string, signal: AbortSignal): Promise<string | null> {
    const zone = env.BRIGHTDATA_UNLOCKER_ZONE
    const token = env.BRIGHTDATA_API_KEY
    if (!zone || !token) return null
    try {
        const res = await fetch('https://api.brightdata.com/request', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ zone, url: targetUrl, format: 'raw' }),
            signal,
        })
        if (!res.ok) {
            console.warn(`[enrich] brightdata unlocker ${res.status} for ${targetUrl}`)
            return null
        }
        return MAX_HTML_CAP(await res.text())
    } catch (err) {
        console.error('[enrich] brightdata unlocker error', err)
        return null
    }
}

/**
 * Get the profile page HTML. Prefers Bright Data Web Unlocker (residential,
 * unblocks the datacenter-IP challenge) when a zone is configured, then a generic
 * raw-HTML proxy (LINKEDIN_SCRAPE_API_URL), then a direct fetch (works from
 * residential IPs / local dev, blocked from datacenter IPs).
 */
async function getProfileHtml(targetUrl: string, signal: AbortSignal): Promise<string | null> {
    const viaBrightData = await fetchViaBrightDataUnlocker(targetUrl, signal)
    if (viaBrightData) return viaBrightData

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
    if (!res.ok) {
        // HTTP 999 / an authwall redirect is LinkedIn blocking the datacenter IP -
        // the reason the JSON-LD tier can't rescue a Scrapingdog miss in prod.
        if (!scrapeApi && !env.BRIGHTDATA_UNLOCKER_ZONE)
            console.warn(`[enrich] linkedin html blocked ${res.status} (datacenter IP, no unlocker/proxy configured)`)
        return null
    }

    // Best-effort size guard. A declared-too-large body is rejected up front;
    // otherwise we cap after buffering (the abort timeout bounds a slow stream).
    const len = Number(res.headers.get('content-length') ?? 0)
    if (len && len > MAX_HTML_BYTES) return null
    return MAX_HTML_CAP(await res.text())
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

    // Scrapingdog manages its own SCRAPINGDOG_TIMEOUT_MS internally - it only
    // needs the caller's signal for an early client-disconnect abort.
    const viaScrapingdog = await fetchViaScrapingdog(url, externalSignal ?? new AbortController().signal)
    if (viaScrapingdog.profile?.found) return viaScrapingdog.profile

    // Scrapingdog produced nothing - carry its reason onto the degraded result
    // so the enrich event records why (the JSON-LD tier below is near-always
    // blocked from Vercel's datacenter IP without a configured unlocker/proxy,
    // so it rarely rescues). This fallback gets its OWN fresh timeout window
    // instead of whatever remained of a shared clock - previously a Scrapingdog
    // timeout alone could leave it only ~3s, never enough for a real HTTP fetch.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FALLBACK_TIMEOUT_MS)
    const onAbort = () => controller.abort()
    externalSignal?.addEventListener('abort', onAbort)
    try {
        const html = await getProfileHtml(url, controller.signal)
        if (!html) return { ...EMPTY, url, failReason: viaScrapingdog.reason ?? 'html-block' }
        const profile = parsePublicProfileHtml(html, url)
        return profile.found ? profile : { ...EMPTY, url, failReason: viaScrapingdog.reason ?? 'parse-miss' }
    } catch {
        return { ...EMPTY, url, failReason: viaScrapingdog.reason ?? 'html-block' }
    } finally {
        clearTimeout(timer)
        externalSignal?.removeEventListener('abort', onAbort)
    }
}
