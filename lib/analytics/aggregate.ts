// ---------------------------------------------------------------------------
// Analytics aggregation - pure functions that turn the raw drafts manifest plus
// the post_metrics map into the view models the dashboard renders. Everything
// here is side-effect free and deterministic (callers pass `now`) so it is easy
// to reason about and test.
// ---------------------------------------------------------------------------

import type { DraftManifestEntry, DraftStatus } from '@/lib/drafts'

import { engagementRate, hasAnyMetric, totalEngagement, type PostMetrics } from './metrics'

/** A published post enriched with its metrics and derived engagement figures. */
export interface PublishedPost {
    entry: DraftManifestEntry
    metrics: PostMetrics | null
    /** Local-epoch ms the post went live (publishedAt, else createdAt as fallback). */
    publishedAt: number
    /** reactions + comments + reshares, or null when unknown. */
    engagement: number | null
    /** engagement / impressions (0..1), or null when not computable. */
    engagementRate: number | null
    impressions: number | null
}

/**
 * Resolve a timestamp's local weekday (0=Mon..6=Sun) and hour (0..23).
 *
 * Omit `tzOffsetMinutes` to use the runtime's local time - correct on the client
 * (browser = the member's timezone). On the server (AI digest) pass the client's
 * `Date.getTimezoneOffset()` so day/hour match what the member sees on screen;
 * without it the server would compute these in UTC and disagree with the dashboard.
 */
export function localParts(ts: number, tzOffsetMinutes?: number): { day: number; hour: number } {
    if (tzOffsetMinutes === undefined) {
        const d = new Date(ts)
        return { day: (d.getDay() + 6) % 7, hour: d.getHours() }
    }
    const d = new Date(ts - tzOffsetMinutes * 60_000)
    return { day: (d.getUTCDay() + 6) % 7, hour: d.getUTCHours() }
}

/** Counts of drafts by lifecycle status (the publish funnel). */
export type StatusCounts = Record<DraftStatus, number>

export function statusCounts(drafts: DraftManifestEntry[]): StatusCounts {
    const counts: StatusCounts = { draft: 0, scheduled: 0, published: 0, failed: 0 }
    for (const d of drafts) counts[d.status]++
    return counts
}

/**
 * The published posts, newest first, each joined to its metrics. A post counts as
 * published when its status is `published`; we use `publishedAt` when present and
 * fall back to `createdAt` so legacy rows (published before publish-time tracking)
 * still place on the timeline.
 */
export function publishedPosts(
    drafts: DraftManifestEntry[],
    metricsByDraft: Record<string, PostMetrics>,
): PublishedPost[] {
    return drafts
        .filter((d) => d.status === 'published')
        .map((entry) => {
            const metrics = metricsByDraft[entry.id] ?? null
            return {
                entry,
                metrics,
                publishedAt: entry.publishedAt ?? entry.createdAt,
                engagement: metrics ? totalEngagement(metrics) : null,
                engagementRate: metrics ? engagementRate(metrics) : null,
                impressions: metrics?.impressions ?? null,
            }
        })
        .sort((a, b) => b.publishedAt - a.publishedAt)
}

/** Headline totals across all published posts (nulls ignored, not counted as 0). */
export interface AnalyticsSummary {
    publishedCount: number
    postsWithMetrics: number
    totalImpressions: number | null
    totalEngagements: number | null
    /** Average of per-post engagement rates, over posts where it is computable. */
    avgEngagementRate: number | null
    totalFollows: number | null
}

export function summarize(posts: PublishedPost[]): AnalyticsSummary {
    let totalImpressions: number | null = null
    let totalEngagements: number | null = null
    let totalFollows: number | null = null
    let rateSum = 0
    let rateCount = 0
    let postsWithMetrics = 0

    for (const p of posts) {
        if (p.metrics && hasAnyMetric(p.metrics)) postsWithMetrics++
        if (p.impressions !== null) totalImpressions = (totalImpressions ?? 0) + p.impressions
        if (p.engagement !== null) totalEngagements = (totalEngagements ?? 0) + p.engagement
        if (p.metrics?.follows != null) totalFollows = (totalFollows ?? 0) + p.metrics.follows
        if (p.engagementRate !== null) {
            rateSum += p.engagementRate
            rateCount++
        }
    }

    return {
        publishedCount: posts.length,
        postsWithMetrics,
        totalImpressions,
        totalEngagements,
        avgEngagementRate: rateCount > 0 ? rateSum / rateCount : null,
        totalFollows,
    }
}

/**
 * Engagement over time: one point per published post (oldest first) carrying its
 * impressions and engagement. The chart connects these to show the trend; we keep
 * raw per-post points rather than bucketing so a sparse history still renders.
 */
export interface TimelinePoint {
    date: number
    title: string
    impressions: number | null
    engagement: number | null
}

export function engagementTimeline(posts: PublishedPost[], sinceMs?: number): TimelinePoint[] {
    return posts
        .filter((p) => sinceMs === undefined || p.publishedAt >= sinceMs)
        .slice()
        .sort((a, b) => a.publishedAt - b.publishedAt)
        .map((p) => ({
            date: p.publishedAt,
            title: p.entry.title || 'Untitled',
            impressions: p.impressions,
            engagement: p.engagement,
        }))
}

/** Per-format performance, sorted by post count desc. */
export interface FormatStat {
    format: string
    count: number
    totalEngagement: number | null
    avgEngagement: number | null
    avgEngagementRate: number | null
}

export function formatBreakdown(posts: PublishedPost[]): FormatStat[] {
    const byFormat = new Map<string, PublishedPost[]>()
    for (const p of posts) {
        const key = p.entry.label || 'Unlabeled'
        const list = byFormat.get(key) ?? []
        list.push(p)
        byFormat.set(key, list)
    }

    const stats: FormatStat[] = []
    for (const [format, list] of byFormat) {
        stats.push({ format, count: list.length, ...avgEngagementStats(list) })
    }
    return stats.sort((a, b) => b.count - a.count)
}

/** Post-length buckets and how engagement varies across them. */
export interface LengthBucket {
    label: string
    count: number
    avgEngagement: number | null
    avgEngagementRate: number | null
}

const LENGTH_BUCKETS: { label: string; max: number }[] = [
    { label: '< 300', max: 300 },
    { label: '300-800', max: 800 },
    { label: '800-1500', max: 1500 },
    { label: '1500+', max: Infinity },
]

export function lengthBreakdown(posts: PublishedPost[]): LengthBucket[] {
    return LENGTH_BUCKETS.map((bucket, i) => {
        const min = i === 0 ? 0 : LENGTH_BUCKETS[i - 1].max
        const list = posts.filter((p) => p.entry.charCount >= min && p.entry.charCount < bucket.max)
        return { label: bucket.label, count: list.length, ...avgEngagementStats(list) }
    })
}

/** Average engagement per weekday (Mon..Sun) over published posts that have data. */
export interface DayStat {
    /** 0 = Monday .. 6 = Sunday */
    day: number
    label: string
    count: number
    avgEngagement: number | null
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function dayOfWeekPerformance(posts: PublishedPost[], tzOffsetMinutes?: number): DayStat[] {
    const buckets: PublishedPost[][] = Array.from({ length: 7 }, () => [])
    for (const p of posts) {
        buckets[localParts(p.publishedAt, tzOffsetMinutes).day].push(p)
    }
    return buckets.map((list, day) => ({
        day,
        label: DAY_LABELS[day],
        count: list.length,
        avgEngagement: avgEngagementStats(list).avgEngagement,
    }))
}

// ---------------------------------------------------------------------------
// Period comparison - current window vs the immediately preceding window of the
// same length, so KPIs can show a trend arrow ("+18% vs previous 30 days").
// ---------------------------------------------------------------------------

export interface PeriodDelta {
    current: number | null
    previous: number | null
    /** Fractional change vs the previous window; null when not computable. */
    delta: number | null
}

export interface PeriodComparison {
    days: number
    posts: PeriodDelta
    impressions: PeriodDelta
    engagements: PeriodDelta
    engagementRate: PeriodDelta
}

export function periodComparison(posts: PublishedPost[], days: number, now: number = Date.now()): PeriodComparison {
    const windowMs = days * 24 * 60 * 60 * 1000
    const currentStart = now - windowMs
    const previousStart = now - 2 * windowMs

    const inWindow = (start: number, end: number) => posts.filter((p) => p.publishedAt >= start && p.publishedAt < end)
    const current = inWindow(currentStart, now)
    const previous = inWindow(previousStart, currentStart)

    return {
        days,
        posts: makeDelta(current.length, previous.length),
        impressions: makeDelta(sumMetric(current, 'impressions'), sumMetric(previous, 'impressions')),
        engagements: makeDelta(sumMetric(current, 'engagement'), sumMetric(previous, 'engagement')),
        engagementRate: makeDelta(windowRate(current), windowRate(previous)),
    }
}

/** A day-of-week × time-of-day grid revealing the member's best posting windows. */
export const TIME_BLOCKS = ['12-4am', '4-8am', '8am-12pm', '12-4pm', '4-8pm', '8pm-12am']

export interface TimeSlotCell {
    /** 0 = Monday .. 6 = Sunday */
    day: number
    /** 0..5 four-hour block, indexes TIME_BLOCKS */
    block: number
    count: number
    avgEngagement: number | null
}

export interface GoldenHour {
    cells: TimeSlotCell[]
    best: { day: number; block: number; avgEngagement: number; count: number } | null
}

export function goldenHour(posts: PublishedPost[], tzOffsetMinutes?: number): GoldenHour {
    const groups = new Map<string, { count: number; engagement: number[]; day: number; block: number }>()
    for (const p of posts) {
        const { day, hour } = localParts(p.publishedAt, tzOffsetMinutes)
        const block = Math.floor(hour / 4)
        const key = `${day}-${block}`
        const g = groups.get(key) ?? { count: 0, engagement: [], day, block }
        g.count++
        if (p.engagement !== null) g.engagement.push(p.engagement)
        groups.set(key, g)
    }

    const cells: TimeSlotCell[] = []
    let best: GoldenHour['best'] = null
    for (const g of groups.values()) {
        const avg = g.engagement.length > 0 ? g.engagement.reduce((s, v) => s + v, 0) / g.engagement.length : null
        cells.push({ day: g.day, block: g.block, count: g.count, avgEngagement: avg })
        if (avg !== null && g.engagement.length >= 1 && (best === null || avg > best.avgEngagement)) {
            best = { day: g.day, block: g.block, avgEngagement: avg, count: g.count }
        }
    }

    return { cells, best }
}

/** The strongest posts by engagement (posts without metrics are excluded). */
export function topPosts(posts: PublishedPost[], limit = 5): PublishedPost[] {
    return posts
        .filter((p) => p.engagement !== null)
        .slice()
        .sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0))
        .slice(0, limit)
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function makeDelta(current: number | null, previous: number | null): PeriodDelta {
    const delta = previous !== null && previous > 0 && current !== null ? current / previous - 1 : null
    return { current, previous, delta }
}

function sumMetric(list: PublishedPost[], key: 'impressions' | 'engagement'): number | null {
    let total: number | null = null
    for (const p of list) {
        const v = p[key]
        if (v !== null) total = (total ?? 0) + v
    }
    return total
}

function windowRate(list: PublishedPost[]): number | null {
    const impressions = sumMetric(list, 'impressions')
    const engagement = sumMetric(list, 'engagement')
    if (impressions === null || impressions <= 0 || engagement === null) return null
    return engagement / impressions
}

function avgEngagementStats(list: PublishedPost[]): {
    totalEngagement: number | null
    avgEngagement: number | null
    avgEngagementRate: number | null
} {
    let engSum = 0
    let engCount = 0
    let rateSum = 0
    let rateCount = 0
    for (const p of list) {
        if (p.engagement !== null) {
            engSum += p.engagement
            engCount++
        }
        if (p.engagementRate !== null) {
            rateSum += p.engagementRate
            rateCount++
        }
    }
    return {
        totalEngagement: engCount > 0 ? engSum : null,
        avgEngagement: engCount > 0 ? engSum / engCount : null,
        avgEngagementRate: rateCount > 0 ? rateSum / rateCount : null,
    }
}
