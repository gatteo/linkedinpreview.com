import {
    isLinkedInAnalyticsTestMode,
    LINKEDIN_API,
    LINKEDIN_API_VERSION,
    LINKEDIN_RESTLI_VERSION,
} from '@/config/linkedin'

import { LinkedInApiError } from './posts'

// ---------------------------------------------------------------------------
// Account-wide LinkedIn analytics: memberFollowersCount (r_member_profileAnalytics,
// 202504+) and memberCreatorPostAnalytics's `q=me` finder (r_member_postAnalytics),
// as opposed to the per-post `q=entity` finder in ./analytics. Neither needs a
// post URN - they cover the member's account as a whole, so unlike per-post
// metrics they are fetch-and-display only (LinkedIn's terms cap storage of
// member social activity at 48h): nothing here is written to Supabase.
//
// Verified against Microsoft Learn (Member Post Statistics / Member Follower
// Statistics, mid-2026 versions):
// - memberCreatorPostAnalytics q=me takes one `queryType` per call (not the
//   comma-joined `metricTypes` the per-post fetcher in ./analytics uses),
//   `aggregation` (TOTAL default, or DAILY - unsupported for MEMBERS_REACHED,
//   LINK_CLICKS, FOLLOWER_GAINED_FROM_CONTENT, PROFILE_VIEW_FROM_CONTENT), and an
//   optional `dateRange`. Since API version 202605, `metricType` in the response
//   is a plain string; older versions nest it as
//   `{ "com.linkedin....CreatorPostAnalyticsMetricTypeV1": "REACTION" }` - the
//   parser below handles both.
// - memberFollowersCount has two finders: `q=me` (lifetime, no dateRange) and
//   `q=dateRange` (daily counts within a window). Both return
//   `{ elements: [{ memberFollowersCount, dateRange? }] }` - no demographics.
// ---------------------------------------------------------------------------

export interface DateRange {
    startMs: number
    endMs: number
}

export interface FollowerSeriesPoint {
    dateMs: number
    count: number
}

/** The account-aggregate metrics the "LinkedIn account analytics" section shows. */
export const ACCOUNT_AGGREGATE_METRICS = ['IMPRESSION', 'MEMBERS_REACHED', 'REACTION', 'COMMENT', 'RESHARE'] as const

export type AccountAggregateMetric = (typeof ACCOUNT_AGGREGATE_METRICS)[number]

function baseHeaders(accessToken: string): Record<string, string> {
    return {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': LINKEDIN_API_VERSION,
        'X-Restli-Protocol-Version': LINKEDIN_RESTLI_VERSION,
    }
}

/** Encode a date range as LinkedIn's Restli struct: (start:(year,month,day),end:(...)). */
function encodeDateRange(range: DateRange): string {
    const start = toYmd(range.startMs)
    const end = toYmd(range.endMs)
    return `(start:(year:${start.year},month:${start.month},day:${start.day}),end:(year:${end.year},month:${end.month},day:${end.day}))`
}

function toYmd(ms: number): { year: number; month: number; day: number } {
    const d = new Date(ms)
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

function coerceNumber(v: unknown): number | null {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v)
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Math.round(Number(v))
    return null
}

/** Pull the metric type out of a response element, tolerating both response shapes. */
function extractMetricType(raw: unknown): string | null {
    if (typeof raw === 'string') return raw
    if (raw && typeof raw === 'object') {
        const value = Object.values(raw as Record<string, unknown>).find((v) => typeof v === 'string')
        return typeof value === 'string' ? value : null
    }
    return null
}

// ---------------------------------------------------------------------------
// Follower count
// ---------------------------------------------------------------------------

/** Lifetime follower count (`q=me`). */
export async function fetchFollowerCount(accessToken: string): Promise<number | null> {
    if (isLinkedInAnalyticsTestMode()) return mockFollowerCount()

    const res = await fetch(`${LINKEDIN_API.memberFollowersCount}?q=me`, {
        method: 'GET',
        headers: baseHeaders(accessToken),
    })
    if (!res.ok) {
        throw new LinkedInApiError('memberFollowersCount (me) failed', res.status, await res.text().catch(() => ''))
    }
    const json = (await res.json()) as unknown
    return parseFollowerElements(json)[0]?.count ?? null
}

/** Daily follower counts for the given window (`q=dateRange`). */
export async function fetchFollowerSeries(accessToken: string, range: DateRange): Promise<FollowerSeriesPoint[]> {
    if (isLinkedInAnalyticsTestMode()) return mockFollowerSeries(range)

    const params = new URLSearchParams({ q: 'dateRange', dateRange: encodeDateRange(range) })
    const res = await fetch(`${LINKEDIN_API.memberFollowersCount}?${params.toString()}`, {
        method: 'GET',
        headers: baseHeaders(accessToken),
    })
    if (!res.ok) {
        throw new LinkedInApiError(
            'memberFollowersCount (dateRange) failed',
            res.status,
            await res.text().catch(() => ''),
        )
    }
    const json = (await res.json()) as unknown
    return parseFollowerElements(json)
}

function parseFollowerElements(json: unknown): FollowerSeriesPoint[] {
    const out: FollowerSeriesPoint[] = []
    if (!json || typeof json !== 'object') return out
    const elements = (json as { elements?: unknown }).elements
    if (!Array.isArray(elements)) return out

    for (const el of elements) {
        if (!el || typeof el !== 'object') continue
        const obj = el as Record<string, unknown>
        const count = coerceNumber(obj.memberFollowersCount)
        if (count === null) continue

        const dateRange = obj.dateRange as { start?: { year?: number; month?: number; day?: number } } | undefined
        const start = dateRange?.start
        const dateMs =
            start?.year && start?.month && start?.day ? Date.UTC(start.year, start.month - 1, start.day) : Date.now()
        out.push({ dateMs, count })
    }
    return out
}

// ---------------------------------------------------------------------------
// Account-wide post metrics aggregate
// ---------------------------------------------------------------------------

/**
 * Total count of one metric across all the member's posts over an optional
 * window (`q=me`, `aggregation=TOTAL`). Returns null when the metric wasn't
 * present in the response rather than throwing, so one odd metric doesn't take
 * down the whole tile row.
 */
async function fetchMemberAggregateMetric(
    accessToken: string,
    metricType: string,
    range?: DateRange,
): Promise<number | null> {
    const params = new URLSearchParams({ q: 'me', queryType: metricType, aggregation: 'TOTAL' })
    if (range) params.set('dateRange', encodeDateRange(range))

    const res = await fetch(`${LINKEDIN_API.memberPostAnalytics}?${params.toString()}`, {
        method: 'GET',
        headers: baseHeaders(accessToken),
    })
    if (!res.ok) {
        throw new LinkedInApiError(
            'memberCreatorPostAnalytics (me) failed',
            res.status,
            await res.text().catch(() => ''),
        )
    }

    const json = (await res.json()) as { elements?: unknown[] }
    const elements = Array.isArray(json.elements) ? json.elements : []
    for (const el of elements) {
        if (!el || typeof el !== 'object') continue
        const obj = el as Record<string, unknown>
        if (extractMetricType(obj.metricType) !== metricType) continue
        const count = coerceNumber(obj.count)
        if (count !== null) return count
    }
    return null
}

/**
 * Fetch several account-aggregate metrics over an optional window. One
 * LinkedIn call per metric type (the API takes a single `queryType` per
 * request); a failure on one metric is reported as `null` rather than failing
 * the whole batch.
 */
export async function fetchMemberAggregate(
    accessToken: string,
    metricTypes: readonly string[],
    range?: DateRange,
): Promise<Record<string, number | null>> {
    if (isLinkedInAnalyticsTestMode()) return mockAggregate(metricTypes, range)

    const out: Record<string, number | null> = {}
    for (const metricType of metricTypes) {
        try {
            out[metricType] = await fetchMemberAggregateMetric(accessToken, metricType, range)
        } catch (err) {
            if (err instanceof LinkedInApiError) {
                console.error(
                    '[member-analytics] aggregate metric failed',
                    metricType,
                    err.status,
                    err.body.slice(0, 500),
                )
            } else {
                console.error(
                    '[member-analytics] aggregate metric failed',
                    metricType,
                    err instanceof Error ? err.message : err,
                )
            }
            out[metricType] = null
        }
    }
    return out
}

// ---------------------------------------------------------------------------
// Test mode - deterministic mock data (see config/linkedin.ts, isLinkedInAnalyticsTestMode)
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000

/** Mulberry32: small deterministic PRNG so mock numbers are stable per seed. */
function seededRandom(seed: number): number {
    let t = (seed + 0x6d2b79f5) | 0
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function mockFollowerCount(): number {
    const today = Math.floor(Date.now() / DAY_MS)
    return Math.round(1240 + today * 0.6)
}

function mockFollowerSeries(range: DateRange): FollowerSeriesPoint[] {
    const startDay = Math.floor(range.startMs / DAY_MS)
    const endDay = Math.floor(range.endMs / DAY_MS)
    const base = mockFollowerCount() - (endDay - startDay) * 0.6

    const points: FollowerSeriesPoint[] = []
    for (let day = startDay; day < endDay; day++) {
        const trend = (day - startDay) * 0.6
        const noise = seededRandom(day) * 4 - 2
        points.push({ dateMs: day * DAY_MS, count: Math.max(0, Math.round(base + trend + noise)) })
    }
    return points
}

const MOCK_AGGREGATE_BASE_30D: Record<string, number> = {
    IMPRESSION: 15400,
    MEMBERS_REACHED: 9800,
    REACTION: 620,
    COMMENT: 84,
    RESHARE: 37,
}

function mockAggregate(metricTypes: readonly string[], range?: DateRange): Record<string, number | null> {
    const days = range ? Math.max(1, Math.round((range.endMs - range.startMs) / DAY_MS)) : 30
    const scale = days / 30
    const seed = range ? Math.floor(range.startMs / DAY_MS) : 0

    const out: Record<string, number | null> = {}
    for (const metricType of metricTypes) {
        const base = MOCK_AGGREGATE_BASE_30D[metricType]
        if (base === undefined) {
            out[metricType] = null
            continue
        }
        const noise = 0.9 + seededRandom(seed + metricType.length) * 0.2
        out[metricType] = Math.round(base * scale * noise)
    }
    return out
}
