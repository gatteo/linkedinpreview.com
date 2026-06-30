import { LINKEDIN_API, LINKEDIN_API_VERSION, LINKEDIN_RESTLI_VERSION } from '@/config/linkedin'
import type { MetricValues } from '@/lib/analytics/metrics'
import { EMPTY_METRIC_VALUES } from '@/lib/analytics/metrics'

import { LinkedInApiError } from './posts'

// ---------------------------------------------------------------------------
// memberCreatorPostAnalytics API (Community Management API, mid-2025+).
//
// Returns engagement metrics for the authenticated member's OWN posts. Requires
// the `r_member_postAnalytics` scope, which is gated behind LinkedIn Community
// Management API approval - so this path is INERT until the operator configures
// the separate analytics app (App B) and the member connects it. Called with App
// B's access token.
//
// The request/response shapes below follow the documented metric set but should
// be re-verified against the live API when the integration is first switched on
// (LinkedIn warns these counts are "best-effort" and may lag the UI). The parser
// is deliberately tolerant: it scans the response for known metric keys rather
// than assuming an exact envelope, so minor version drift does not break it.
// ---------------------------------------------------------------------------

/** Maps LinkedIn metric keys to our metric fields. */
const METRIC_KEY_MAP: Record<string, keyof MetricValues> = {
    IMPRESSION: 'impressions',
    MEMBERS_REACHED: 'reach',
    REACTION: 'reactions',
    COMMENT: 'comments',
    RESHARE: 'reshares',
    POST_SAVE: 'saves',
    POST_SEND: 'sends',
    LINK_CLICKS: 'linkClicks',
    FOLLOWER_GAINED_FROM_CONTENT: 'follows',
    PROFILE_VIEW_FROM_CONTENT: 'profileViews',
}

/** The LinkedIn metric keys we request (TOTAL aggregation, lifetime). */
const REQUESTED_METRICS = Object.keys(METRIC_KEY_MAP)

/**
 * Fetch lifetime analytics for a single member post by its URN
 * (e.g. `urn:li:share:123` or `urn:li:ugcPost:123`). Returns the parsed metric
 * values; throws `LinkedInApiError` on a non-OK response.
 */
export async function fetchMemberPostAnalytics(accessToken: string, postUrn: string): Promise<MetricValues> {
    const entity = postUrn.startsWith('urn:li:ugcPost:')
        ? `(ugcPost:${encodeURIComponent(postUrn)})`
        : `(share:${encodeURIComponent(postUrn)})`

    const params = new URLSearchParams({
        q: 'entity',
        entity,
        aggregation: 'TOTAL',
        metricTypes: REQUESTED_METRICS.join(','),
    })

    const res = await fetch(`${LINKEDIN_API.memberPostAnalytics}?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'LinkedIn-Version': LINKEDIN_API_VERSION,
            'X-Restli-Protocol-Version': LINKEDIN_RESTLI_VERSION,
        },
    })

    if (!res.ok) {
        throw new LinkedInApiError('memberCreatorPostAnalytics failed', res.status, await res.text().catch(() => ''))
    }

    const json = (await res.json()) as unknown
    return parseAnalyticsResponse(json)
}

/**
 * Walk an analytics response and pull out any known metric values. Handles both
 * `{ metricType, value }` element lists and flat `{ IMPRESSION: n, ... }` objects,
 * so the parser survives reasonable shape variation across API versions.
 */
export function parseAnalyticsResponse(json: unknown): MetricValues {
    const values: MetricValues = { ...EMPTY_METRIC_VALUES }

    const visit = (node: unknown): void => {
        if (node === null || typeof node !== 'object') return

        if (Array.isArray(node)) {
            for (const item of node) visit(item)
            return
        }

        const obj = node as Record<string, unknown>

        // Shape A: element carries an explicit metric type + value.
        const metricType = typeof obj.metricType === 'string' ? obj.metricType : undefined
        if (metricType && metricType in METRIC_KEY_MAP) {
            const num = coerceNumber(obj.value ?? obj.metricValue)
            if (num !== null) values[METRIC_KEY_MAP[metricType]] = num
        }

        // Shape B: flat keys named after metric types.
        for (const [key, field] of Object.entries(METRIC_KEY_MAP)) {
            if (key in obj) {
                const num = coerceNumber(obj[key])
                if (num !== null) values[field] = num
            }
        }

        for (const child of Object.values(obj)) visit(child)
    }

    visit(json)
    return values
}

function coerceNumber(v: unknown): number | null {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v)
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Math.round(Number(v))
    return null
}
