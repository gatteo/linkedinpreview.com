// ---------------------------------------------------------------------------
// Per-post content features. Deterministic signals extracted from a published
// post's text/media/timing - the inputs the correlation engine (content-dna)
// relates to engagement. Kept separate and pure so both the dashboard and the
// AI insights digest can derive the same features.
// ---------------------------------------------------------------------------

import { computeContentStats } from '@/lib/content-scoring'
import type { PublishedPostContent } from '@/lib/supabase/published-posts'

import { localParts } from './aggregate'

export interface PostFeatures {
    charCount: number
    wordCount: number
    lineCount: number
    hashtagCount: number
    emojiCount: number
    hasMedia: boolean
    /** First non-empty line is phrased as a question. */
    startsWithQuestion: boolean
    /** Body contains a bullet/numbered list (a common "listicle" structure). */
    hasList: boolean
    format: string | null
    /** 0 = Monday .. 6 = Sunday (local time). */
    dayOfWeek: number
    /** 0..23 local hour the post went live. */
    hour: number
}

const LIST_LINE = /^\s*(?:[-*•·▪◦]|\d+[.)]|[a-z][.)])\s+/i

export function extractFeatures(post: PublishedPostContent, tzOffsetMinutes?: number): PostFeatures {
    const stats = computeContentStats(post.plainText)
    const lines = post.plainText.split('\n').map((l) => l.trim())
    const firstLine = lines.find((l) => l.length > 0) ?? ''
    const { day, hour } = localParts(post.publishedAt, tzOffsetMinutes)

    return {
        charCount: stats.charCount,
        wordCount: stats.wordCount,
        lineCount: stats.lineCount,
        hashtagCount: stats.hashtagCount,
        emojiCount: stats.emojiCount,
        hasMedia: post.hasMedia,
        startsWithQuestion: firstLine.endsWith('?'),
        hasList: lines.some((l) => LIST_LINE.test(l)),
        format: post.label,
        dayOfWeek: day,
        hour,
    }
}

/** Extract features for many posts at once, keyed by post id. */
export function extractAllFeatures(
    posts: Map<string, PublishedPostContent>,
    tzOffsetMinutes?: number,
): Map<string, PostFeatures> {
    const out = new Map<string, PostFeatures>()
    for (const [id, post] of posts) out.set(id, extractFeatures(post, tzOffsetMinutes))
    return out
}
