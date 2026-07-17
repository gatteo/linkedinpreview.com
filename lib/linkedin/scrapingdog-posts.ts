import type { RichPost } from '@/types/onboarding'

// ---------------------------------------------------------------------------
// Gated-profile fallback corpus, parsed from the already-fetched Scrapingdog
// PROFILE record (session.fast_raw). When Bright Data's posts dataset returns a
// dead_page / "hidden or private" error for a profile whose logged-out view is
// gated, the member's own writing is still visible in fast_raw.activities /
// fast_raw.articles as ~150-char title previews. This turns those previews into
// authored RichPosts so the audit stays personalized instead of falling back to
// a generic benchmark. No engagement counts and no dates are available from
// this source, so reactions/comments/date are left undefined.
// ---------------------------------------------------------------------------

const MIN_POST_CHARS = 25
const MAX_POSTS = 20

type ScrapingdogActivity = { link?: string; image?: string; title?: string; activity?: string }
type ScrapingdogArticle = { link?: string; title?: string; author?: string; published_date?: string }

/** Strip a trailing ellipsis (single char or three dots) left by the preview truncation. */
function cleanTitle(title: string): string {
    return title
        .trim()
        .replace(/(?:…|\.\.\.)\s*$/, '')
        .trim()
}

/**
 * The permalink slug is the only reliable authorship signal. A plain reshare of
 * someone else's post carries the ORIGINAL author's "/posts/<slug>_" handle, so
 * matching on the member's own slug excludes it. The "Shared by <member>"
 * descriptor also tags reshares of others' content, so it cannot stand alone
 * without pulling third-party text into the authored corpus.
 */
function isOwnActivity(activity: ScrapingdogActivity, slugLower: string): boolean {
    const match = /\/posts\/([^_/?#]+)_/i.exec(activity.link ?? '')
    return !!match && match[1].toLowerCase() === slugLower
}

/**
 * Build an authored corpus from the persisted Scrapingdog profile record. Own
 * activities become authored posts (cleaned title preview); articles contribute
 * their title. Deduped by text and capped, with the raw source objects returned
 * for the posts_raw archive.
 */
export function postsFromScrapingdogProfile(
    fastRaw: Record<string, unknown> | null,
    slug: string,
): { posts: RichPost[]; records: Record<string, unknown>[] } {
    if (!fastRaw) return { posts: [], records: [] }

    const slugLower = slug.trim().toLowerCase()
    const activities = Array.isArray(fastRaw.activities) ? (fastRaw.activities as ScrapingdogActivity[]) : []
    const articles = Array.isArray(fastRaw.articles) ? (fastRaw.articles as ScrapingdogArticle[]) : []

    const posts: RichPost[] = []
    const records: Record<string, unknown>[] = []
    const seen = new Set<string>()

    const add = (text: string, raw: Record<string, unknown>) => {
        if (text.length < MIN_POST_CHARS || seen.has(text) || posts.length >= MAX_POSTS) return
        seen.add(text)
        posts.push({ text, origin: 'post' })
        records.push(raw)
    }

    for (const activity of activities) {
        if (!slugLower || !isOwnActivity(activity, slugLower)) continue
        add(cleanTitle((activity.title ?? '').trim()), activity as Record<string, unknown>)
    }

    // articles[] on a Scrapingdog profile record are the owner's own published
    // Pulse articles; their URLs are keyed on a title/name slug, not the /in/
    // vanity slug, so they must NOT be gated on the vanity slug.
    for (const article of articles) {
        add((article.title ?? '').trim(), article as Record<string, unknown>)
    }

    return { posts, records }
}
