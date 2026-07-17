import { env } from '@/env.mjs'
import type { ObservedCadence, RichPost, RichProfileSummary, StyleHints } from '@/types/onboarding'

// ---------------------------------------------------------------------------
// Rich LinkedIn profile scrape via Bright Data's "LinkedIn People Profile"
// dataset (structured JSON: about, followers, ~10-20 recent posts with dates).
//
// The dataset is ASYNC by nature: trigger -> snapshot_id -> poll -> download,
// measured at 42-60s end to end for LinkedIn profiles. (The docs' "synchronous"
// /scrape endpoint just holds the connection ~35s and then falls back to a 202
// + snapshot_id, so we use the explicit trigger + poll from the start.) The
// onboarding hides that latency behind its question steps: the enrich route
// triggers, the status route polls, the client never blocks on it.
//
// Nothing here throws to callers - every failure maps to null / 'failed' so the
// onboarding degrades instead of erroring.
// ---------------------------------------------------------------------------

const BRIGHTDATA_LINKEDIN_DATASET = 'gd_l1viktl72bvl7bjuj0'
// "LinkedIn posts" dataset, discover-by-profile-URL mode: one record per post
// with FULL text, ISO date, and engagement counts - the analysis corpus. The
// people-profile dataset above stays the identity source (followers, about).
const BRIGHTDATA_POSTS_DATASET = 'gd_lyy3tktm25m4avu764'
const API_BASE = 'https://api.brightdata.com/datasets/v3'

const TRIGGER_TIMEOUT_MS = 8_000
const PROGRESS_TIMEOUT_MS = 8_000
const SNAPSHOT_TIMEOUT_MS = 15_000

const MAX_POSTS = 20
const MAX_ACTIVITY = 10
const MAX_POST_CHARS = 500
/** Posts-dataset records carry the complete text; keep enough to judge hooks and CTAs. */
const MAX_FULL_POST_CHARS = 1_500
const MIN_POST_CHARS = 25
const POSTS_DISCOVER_LIMIT = 20

type BrightDataPost = {
    title?: string
    /** Bright Data puts the post-body preview here on authored posts. */
    attribution?: string
    text?: string
    created_at?: string
    interaction?: string
    link?: string
}

type BrightDataRecord = {
    name?: string
    position?: string
    about?: string
    avatar?: string
    url?: string
    input_url?: string
    linkedin_id?: string
    followers?: number
    connections?: number
    posts?: BrightDataPost[]
    activity?: BrightDataPost[]
    error?: string
}

function headers(): Record<string, string> {
    return { 'Authorization': `Bearer ${env.BRIGHTDATA_API_KEY}`, 'Content-Type': 'application/json' }
}

function datasetId(): string {
    return env.BRIGHTDATA_LINKEDIN_DATASET_ID || BRIGHTDATA_LINKEDIN_DATASET
}

/** Kick off a snapshot for one profile URL. Returns the snapshot id, or null. */
export async function triggerRichScrape(targetUrl: string): Promise<string | null> {
    if (!env.BRIGHTDATA_API_KEY) return null
    try {
        const endpoint = `${API_BASE}/trigger?dataset_id=${encodeURIComponent(datasetId())}&include_errors=true`
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify([{ url: targetUrl }]),
            signal: AbortSignal.timeout(TRIGGER_TIMEOUT_MS),
        })
        if (!res.ok) return null
        const data = (await res.json()) as { snapshot_id?: string }
        return typeof data.snapshot_id === 'string' && data.snapshot_id ? data.snapshot_id : null
    } catch {
        return null
    }
}

/** Kick off a posts-dataset discovery for one profile URL. Returns the snapshot id, or null. */
export async function triggerPostsDiscovery(targetUrl: string): Promise<string | null> {
    if (!env.BRIGHTDATA_API_KEY) return null
    try {
        const params = new URLSearchParams({
            dataset_id: BRIGHTDATA_POSTS_DATASET,
            include_errors: 'true',
            type: 'discover_new',
            discover_by: 'profile_url',
            limit_per_input: String(POSTS_DISCOVER_LIMIT),
        })
        const res = await fetch(`${API_BASE}/trigger?${params.toString()}`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify([{ url: targetUrl }]),
            signal: AbortSignal.timeout(TRIGGER_TIMEOUT_MS),
        })
        if (!res.ok) return null
        const data = (await res.json()) as { snapshot_id?: string }
        return typeof data.snapshot_id === 'string' && data.snapshot_id ? data.snapshot_id : null
    } catch {
        return null
    }
}

export type RichScrapeResult =
    | { status: 'pending' }
    | { status: 'failed' }
    | {
          status: 'ready'
          profile: RichProfileSummary
          posts: RichPost[]
          observed: ObservedCadence | null
          /** The complete provider record, persisted verbatim for later analysis. */
          record: Record<string, unknown>
      }

/** Check a snapshot's progress; when ready, download and normalize it. */
export async function checkRichScrape(snapshotId: string): Promise<RichScrapeResult> {
    if (!env.BRIGHTDATA_API_KEY) return { status: 'failed' }
    try {
        const progressRes = await fetch(`${API_BASE}/progress/${encodeURIComponent(snapshotId)}`, {
            headers: headers(),
            signal: AbortSignal.timeout(PROGRESS_TIMEOUT_MS),
        })
        if (!progressRes.ok) return { status: 'pending' }
        const progress = (await progressRes.json()) as { status?: string }
        const state = (progress.status ?? '').toLowerCase()
        if (state === 'failed' || state === 'error') return { status: 'failed' }
        if (state !== 'ready') return { status: 'pending' }

        const snapshotRes = await fetch(`${API_BASE}/snapshot/${encodeURIComponent(snapshotId)}?format=json`, {
            headers: headers(),
            signal: AbortSignal.timeout(SNAPSHOT_TIMEOUT_MS),
        })
        // Bright Data can briefly answer 202 between "ready" and downloadable.
        if (snapshotRes.status === 202) return { status: 'pending' }
        if (!snapshotRes.ok) return { status: 'failed' }
        const body = (await snapshotRes.json()) as BrightDataRecord | BrightDataRecord[]
        const record = Array.isArray(body) ? body[0] : body
        if (!record || record.error) return { status: 'failed' }

        const posts = normalizePosts(record)
        return {
            status: 'ready',
            profile: {
                name: (record.name ?? '').trim(),
                headline: (record.position ?? '').trim(),
                about: (record.about ?? '').trim(),
                avatarUrl: (record.avatar ?? '').trim(),
                followers: typeof record.followers === 'number' ? record.followers : null,
                connections: typeof record.connections === 'number' ? record.connections : null,
            },
            posts,
            observed: computeObservedCadence(posts),
            record: record as Record<string, unknown>,
        }
    } catch {
        // Transient network trouble: let the next poll retry rather than failing the scrape.
        return { status: 'pending' }
    }
}

type BrightDataPostRecord = {
    user_id?: string
    post_text?: string
    date_posted?: string
    num_likes?: number
    num_comments?: number
    post_type?: string
    error?: string
}

export type PostsScrapeResult =
    | { status: 'pending' }
    | { status: 'failed' }
    | {
          status: 'ready'
          posts: RichPost[]
          /** The complete provider records, persisted verbatim for later analysis. */
          records: Record<string, unknown>[]
          /**
           * Every downloaded record was an error record (dead_page / "hidden or
           * private"): the logged-out view is gated even though the member may
           * post. Distinguishes a gated profile from a genuinely postless one so
           * callers can reach for the Scrapingdog-activity fallback corpus.
           */
          gated?: boolean
      }

/** Check a posts-discovery snapshot; when ready, download and normalize it. */
export async function checkPostsScrape(snapshotId: string): Promise<PostsScrapeResult> {
    if (!env.BRIGHTDATA_API_KEY) return { status: 'failed' }
    try {
        const progressRes = await fetch(`${API_BASE}/progress/${encodeURIComponent(snapshotId)}`, {
            headers: headers(),
            signal: AbortSignal.timeout(PROGRESS_TIMEOUT_MS),
        })
        if (!progressRes.ok) return { status: 'pending' }
        const progress = (await progressRes.json()) as { status?: string }
        const state = (progress.status ?? '').toLowerCase()
        if (state === 'failed' || state === 'error') return { status: 'failed' }
        if (state !== 'ready') return { status: 'pending' }

        const snapshotRes = await fetch(`${API_BASE}/snapshot/${encodeURIComponent(snapshotId)}?format=json`, {
            headers: headers(),
            signal: AbortSignal.timeout(SNAPSHOT_TIMEOUT_MS),
        })
        if (snapshotRes.status === 202) return { status: 'pending' }
        if (!snapshotRes.ok) return { status: 'failed' }
        const body = (await snapshotRes.json()) as BrightDataPostRecord | BrightDataPostRecord[]
        const rawRecords = Array.isArray(body) ? body : [body]
        const rawCount = rawRecords.length
        const records = rawRecords.filter((r) => r && !r.error)
        // All records were errors (dead_page / private) with at least one present.
        const gated = records.length === 0 && rawCount > 0

        const posts: RichPost[] = records
            .filter((r) => (r.post_type ?? 'post') === 'post')
            .map((r) => ({
                text: (r.post_text ?? '').trim().slice(0, MAX_FULL_POST_CHARS),
                date: typeof r.date_posted === 'string' && r.date_posted ? r.date_posted : undefined,
                origin: 'post' as const,
                ...(typeof r.num_likes === 'number' ? { reactions: r.num_likes } : {}),
                ...(typeof r.num_comments === 'number' ? { comments: r.num_comments } : {}),
            }))
            .filter((p) => p.text.length >= MIN_POST_CHARS)
            .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
            .slice(0, MAX_POSTS)

        return { status: 'ready', posts, records: records as Record<string, unknown>[], gated }
    } catch {
        // Transient network trouble: let the next poll retry rather than failing the scrape.
        return { status: 'pending' }
    }
}

/** Followers backfill from posts-dataset records when the profile snapshot isn't in yet. */
export function followersFromPostRecords(records: Record<string, unknown>[]): number | null {
    for (const r of records) {
        const f = (r as { user_followers?: unknown }).user_followers
        if (typeof f === 'number' && f > 0) return f
    }
    return null
}

/** Merge title + body preview into one classification-friendly text. */
function postText(p: BrightDataPost): string {
    const parts = [p.title, p.attribution ?? p.text].map((s) => (s ?? '').trim()).filter(Boolean)
    const joined = Array.from(new Set(parts)).join('\n')
    return joined.length > MAX_POST_CHARS ? joined.slice(0, MAX_POST_CHARS) : joined
}

/** The member's public handle, for telling their own posts from others' in the activity feed. */
function memberHandle(record: BrightDataRecord): string | null {
    if (typeof record.linkedin_id === 'string' && record.linkedin_id) return record.linkedin_id.toLowerCase()
    const match = /\/in\/([^/?#]+)/.exec(record.url ?? record.input_url ?? '')
    return match ? decodeURIComponent(match[1]).toLowerCase() : null
}

/**
 * Authored posts first (the member's actual writing, dated), then a few
 * activity items (likes/reshares of others' content - interest signal only,
 * never treated as their writing). Many profile snapshots carry no `posts`
 * array at all and return the member's own posts inside `activity` instead:
 * "shared this" items whose permalink slug opens with the member's own handle
 * are their authored writing and are classified as such.
 */
function normalizePosts(record: BrightDataRecord): RichPost[] {
    const handle = memberHandle(record)
    const ownPost = (p: BrightDataPost) =>
        !!handle &&
        (p.interaction ?? '').toLowerCase().includes('shared this') &&
        (p.link ?? '').toLowerCase().includes(`/posts/${handle}_`)

    const authored: RichPost[] = [...(record.posts ?? []), ...(record.activity ?? []).filter(ownPost)]
        .map((p) => ({
            text: postText(p),
            date: typeof p.created_at === 'string' && p.created_at ? p.created_at : undefined,
            origin: 'post' as const,
        }))
        .filter((p) => p.text.length >= MIN_POST_CHARS)
        .slice(0, MAX_POSTS)

    const authoredTexts = new Set(authored.map((p) => p.text))
    const activity: RichPost[] = (record.activity ?? [])
        .filter((p) => !ownPost(p))
        .map((p) => ({ text: postText(p), origin: 'activity' as const }))
        .filter((p) => p.text.length >= MIN_POST_CHARS && !authoredTexts.has(p.text))
        .slice(0, MAX_ACTIVITY)

    return [...authored, ...activity]
}

// Common-word markers per language, scored against the corpus. Deliberately
// tiny: the goal is "which language do they post in", not linguistics.
const LANG_MARKERS: Record<string, string[]> = {
    en: ['the', 'and', 'with', 'that', 'this', 'for', 'you', 'your', 'from', 'have'],
    it: ['che', 'per', 'con', 'una', 'sono', 'della', 'più', 'come', 'anche', 'questo'],
    es: ['que', 'para', 'con', 'una', 'los', 'las', 'por', 'como', 'más', 'pero'],
    fr: ['que', 'pour', 'avec', 'une', 'les', 'des', 'dans', 'est', 'pas', 'plus'],
    de: ['und', 'der', 'die', 'das', 'mit', 'für', 'ist', 'nicht', 'ein', 'auch'],
    pt: ['que', 'para', 'com', 'uma', 'não', 'mais', 'por', 'como', 'dos', 'isso'],
}

/**
 * The language the member actually posts in, from marker-word counting over
 * the authored corpus (never the LLM). Null when the signal is too thin to
 * call - callers must treat null as "unknown", not English.
 */
export function detectLanguage(texts: string[]): string | null {
    const words = texts
        .join(' ')
        .toLowerCase()
        .split(/[^\p{L}]+/u)
        .filter(Boolean)
    if (words.length < 30) return null
    const counts = new Map<string, number>()
    for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1)
    let best: string | null = null
    let bestScore = 0
    for (const [lang, markers] of Object.entries(LANG_MARKERS)) {
        const score = markers.reduce((n, m) => n + (counts.get(m) ?? 0), 0)
        if (score > bestScore) {
            bestScore = score
            best = lang
        }
    }
    // Require real signal: at least ~1 marker hit per 40 words.
    return bestScore >= Math.max(3, words.length / 40) ? best : null
}

/**
 * Deterministic writing-style defaults from the user's real authored posts
 * (regex counting over the text previews, never the LLM). Post previews can be
 * truncated, so only signals that survive truncation are inferred: sentence
 * length, emoji frequency, and posting language. Null when too little signal.
 */
export function inferStyleHints(posts: RichPost[]): StyleHints | null {
    const texts = posts.filter((p) => p.origin === 'post').map((p) => p.text)
    if (texts.length < 3) return null

    const language = detectLanguage(texts)

    const emojiRe = /\p{Extended_Pictographic}/gu
    const emojisPerPost = texts.reduce((n, t) => n + (t.match(emojiRe)?.length ?? 0), 0) / texts.length
    const emojiFrequency: StyleHints['emojiFrequency'] =
        emojisPerPost < 0.34 ? 'none' : emojisPerPost <= 3 ? 'moderate' : 'a-lot'

    const sentences = texts
        .flatMap((t) => t.split(/[.!?\n]+/))
        .map((s) => s.trim().split(/\s+/).filter(Boolean).length)
        .filter((words) => words >= 2)
    if (sentences.length < 5) return { sentenceLength: 'standard', emojiFrequency, language }
    const avgWords = sentences.reduce((a, b) => a + b, 0) / sentences.length
    const sentenceLength: StyleHints['sentenceLength'] = avgWords < 9 ? 'short' : avgWords <= 16 ? 'standard' : 'long'

    return { sentenceLength, emojiFrequency, language }
}

/**
 * Deterministic posting rhythm from authored-post dates. postsPerWeek averages
 * over the sample's own span (a capped post list can't understate an active
 * poster); null when no dates or a single-day span.
 */
export function computeObservedCadence(posts: RichPost[]): ObservedCadence | null {
    const times = posts
        .filter((p) => p.origin === 'post' && p.date)
        .map((p) => new Date(p.date as string).getTime())
        .filter((t) => Number.isFinite(t))
    if (times.length === 0) return null

    const now = Date.now()
    const day = 86_400_000
    const newest = Math.max(...times)
    const oldest = Math.min(...times)
    const spanWeeks = (newest - oldest) / (7 * day)

    return {
        postsLast30d: times.filter((t) => t >= now - 30 * day).length,
        postsLast90d: times.filter((t) => t >= now - 90 * day).length,
        postsPerWeek: times.length >= 2 && spanWeeks >= 1 ? Math.round((times.length / spanWeeks) * 10) / 10 : null,
        newestPostAt: new Date(newest).toISOString(),
        oldestPostAt: new Date(oldest).toISOString(),
    }
}
