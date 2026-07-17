import { LINKEDIN_API, LINKEDIN_API_VERSION, LINKEDIN_RESTLI_VERSION } from '@/config/linkedin'

import { LinkedInApiError } from './posts'

// ---------------------------------------------------------------------------
// Import a member's EXISTING LinkedIn posts (the ones they already published,
// including before they ever used this app) via the versioned Posts API author
// finder. Paired with memberCreatorPostAnalytics (see ./analytics) this backfills
// the analytics dashboard with real history.
//
// Like the rest of the analytics-sync path this is INERT until the operator
// configures the analytics app (App B - LINKEDIN_ANALYTICS_CLIENT_ID/SECRET) and
// the member connects it, which requires Community Management API access. The
// token used here is App B's; the author URN is reused from the App A connection.
// The exact author-finder/response shape should be re-verified against
// the live API on first enable (LinkedIn versions the Posts API monthly); the
// parser below is deliberately tolerant of field/shape drift.
// ---------------------------------------------------------------------------

export interface ImportedPost {
    /** Post URN, e.g. urn:li:share:123 or urn:li:ugcPost:123. */
    urn: string
    /** The post body text (commentary), if present. */
    commentary: string
    /** Public post URL. */
    url: string
    /** Epoch ms the post was created, or null when not provided. */
    createdAtMs: number | null
}

/** How many posts to pull per page, and the overall safety cap. */
const PAGE_SIZE = 50
const MAX_POSTS = 300

/** Build the public feed URL for a post URN. */
export function postUrlFromUrn(urn: string): string {
    return `https://www.linkedin.com/feed/update/${urn}`
}

/**
 * Fetch the member's own posts (newest first), following paging up to MAX_POSTS.
 * `authorUrn` is the person URN (urn:li:person:{sub}).
 */
export async function fetchMemberPosts(accessToken: string, authorUrn: string): Promise<ImportedPost[]> {
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': LINKEDIN_API_VERSION,
        'X-Restli-Protocol-Version': LINKEDIN_RESTLI_VERSION,
    }

    const out: ImportedPost[] = []
    let start = 0

    while (out.length < MAX_POSTS) {
        const params = new URLSearchParams({
            q: 'author',
            author: authorUrn,
            count: String(PAGE_SIZE),
            start: String(start),
            sortBy: 'CREATED',
        })

        const res = await fetch(`${LINKEDIN_API.posts}?${params.toString()}`, { method: 'GET', headers })
        if (!res.ok) {
            throw new LinkedInApiError('Posts author finder failed', res.status, await res.text().catch(() => ''))
        }

        const json = (await res.json()) as { elements?: unknown[]; paging?: { total?: number } }
        const elements = Array.isArray(json.elements) ? json.elements : []
        if (elements.length === 0) break

        for (const el of elements) {
            const post = parsePostElement(el)
            if (post) out.push(post)
        }

        if (elements.length < PAGE_SIZE) break
        start += PAGE_SIZE
    }

    return out.slice(0, MAX_POSTS)
}

/** Pull the fields we need out of one Posts API element, tolerating shape drift. */
function parsePostElement(el: unknown): ImportedPost | null {
    if (!el || typeof el !== 'object') return null
    const obj = el as Record<string, unknown>

    const urn = typeof obj.id === 'string' ? obj.id : typeof obj.urn === 'string' ? obj.urn : null
    if (!urn) return null

    const commentary = typeof obj.commentary === 'string' ? obj.commentary : ''
    const createdAtMs = extractCreatedAt(obj)

    return { urn, commentary, url: postUrlFromUrn(urn), createdAtMs }
}

function extractCreatedAt(obj: Record<string, unknown>): number | null {
    // Newer Posts API exposes `createdAt` (epoch ms); older shapes nest it under
    // `created.time`.
    if (typeof obj.createdAt === 'number' && Number.isFinite(obj.createdAt)) return obj.createdAt
    const created = obj.created
    if (created && typeof created === 'object') {
        const time = (created as Record<string, unknown>).time
        if (typeof time === 'number' && Number.isFinite(time)) return time
    }
    return null
}

/**
 * Convert a post's plain-text commentary into a minimal TipTap document so it can
 * be stored in `drafts.content` and round-tripped by the editor / preview / the
 * content-feature extractor. Blank lines become empty paragraphs.
 */
export function commentaryToTiptapDoc(commentary: string): { type: 'doc'; content: unknown[] } {
    const lines = commentary.split('\n')
    const content = lines.map((line) =>
        line.length > 0 ? { type: 'paragraph', content: [{ type: 'text', text: line }] } : { type: 'paragraph' },
    )
    return { type: 'doc', content: content.length > 0 ? content : [{ type: 'paragraph' }] }
}
