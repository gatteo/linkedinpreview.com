// ---------------------------------------------------------------------------
// Post performance metrics - shared types and pure engagement math.
//
// A `PostMetrics` mirrors one `post_metrics` row (camelCased). Every count is
// nullable: a value is null when that number is genuinely unknown (e.g. a member
// typed in only reactions/comments), which is different from a real zero. The
// helpers below treat null as "no data" rather than 0 so a half-filled post never
// reads as a zero-engagement post.
// ---------------------------------------------------------------------------

export type MetricSource = 'manual' | 'csv' | 'linkedin_api'

export interface PostMetrics {
    draftId: string
    impressions: number | null
    reach: number | null
    reactions: number | null
    comments: number | null
    reshares: number | null
    saves: number | null
    sends: number | null
    linkClicks: number | null
    follows: number | null
    profileViews: number | null
    source: MetricSource
    measuredAt: number
    updatedAt: number
}

/** The fields a member can enter/edit by hand or that a CSV/API import writes. */
export type MetricValues = Pick<
    PostMetrics,
    | 'impressions'
    | 'reach'
    | 'reactions'
    | 'comments'
    | 'reshares'
    | 'saves'
    | 'sends'
    | 'linkClicks'
    | 'follows'
    | 'profileViews'
>

/** The three engagement actions that make up the headline engagement total. */
const ENGAGEMENT_KEYS = ['reactions', 'comments', 'reshares'] as const

/**
 * Headline engagement = reactions + comments + reshares. Returns null only when
 * all three are unknown; a present-but-zero component still counts as data.
 */
export function totalEngagement(m: MetricValues): number | null {
    let sum = 0
    let hasData = false
    for (const key of ENGAGEMENT_KEYS) {
        const v = m[key]
        if (v !== null && v !== undefined) {
            sum += v
            hasData = true
        }
    }
    return hasData ? sum : null
}

/**
 * Engagement rate = engagement / impressions, as a 0..1 fraction. Null when
 * impressions are unknown or zero, or when no engagement data exists.
 */
export function engagementRate(m: MetricValues): number | null {
    const engagement = totalEngagement(m)
    if (engagement === null) return null
    if (m.impressions === null || m.impressions === undefined || m.impressions <= 0) return null
    return engagement / m.impressions
}

/** True when a metrics record carries at least one known number. */
export function hasAnyMetric(m: MetricValues): boolean {
    return (
        totalEngagement(m) !== null ||
        m.impressions !== null ||
        m.reach !== null ||
        m.saves !== null ||
        m.sends !== null ||
        m.linkClicks !== null ||
        m.follows !== null ||
        m.profileViews !== null
    )
}

/** Empty metric values - the starting point for a new manual entry. */
export const EMPTY_METRIC_VALUES: MetricValues = {
    impressions: null,
    reach: null,
    reactions: null,
    comments: null,
    reshares: null,
    saves: null,
    sends: null,
    linkClicks: null,
    follows: null,
    profileViews: null,
}
