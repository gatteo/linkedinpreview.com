// ---------------------------------------------------------------------------
// Analytics digest - a compact, structured summary of a member's performance
// that the AI insights endpoint feeds to the model. Built from the same pure
// aggregation + correlation functions the dashboard renders, so the AI reasons
// over exactly what the member sees. Deterministic (callers pass `now`).
// ---------------------------------------------------------------------------

import type { PublishedPostContent } from '@/lib/supabase/published-posts'

import {
    dayOfWeekPerformance,
    formatBreakdown,
    goldenHour,
    lengthBreakdown,
    periodComparison,
    publishedPosts,
    summarize,
    TIME_BLOCKS,
    topPosts,
} from './aggregate'
import { analyzeContentDna } from './content-dna'
import { extractAllFeatures, type PostFeatures } from './content-features'
import type { PostMetrics } from './metrics'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const round = (n: number | null, digits = 0): number | null =>
    n === null ? null : Math.round(n * 10 ** digits) / 10 ** digits

export interface AnalyticsDigest {
    overview: {
        publishedPosts: number
        postsWithMetrics: number
        totalImpressions: number | null
        totalEngagements: number | null
        avgEngagementRatePct: number | null
        followersGained: number | null
    }
    last30Days: {
        posts: number | null
        impressions: number | null
        engagements: number | null
        engagementsDeltaPct: number | null
    }
    formats: { format: string; posts: number; avgEngagement: number | null }[]
    lengths: { range: string; posts: number; avgEngagement: number | null }[]
    bestDay: { day: string; avgEngagement: number | null } | null
    bestTimeSlot: { day: string; time: string; avgEngagement: number; posts: number } | null
    drivers: { factor: string; effectPct: number; basedOnPosts: number }[]
    topPosts: { title: string; engagement: number | null; impressions: number | null; opening: string }[]
    dataQuality: { enoughForCorrelations: boolean; analyzableSample: number }
}

/**
 * Build the digest from the drafts manifest, metrics, and published-post content.
 * `contentById` supplies post bodies for feature correlation and hook snippets.
 */
export function buildAnalyticsDigest(
    drafts: Parameters<typeof publishedPosts>[0],
    metricsByDraft: Record<string, PostMetrics>,
    contentById: Map<string, PublishedPostContent>,
    now: number = Date.now(),
    tzOffsetMinutes?: number,
): AnalyticsDigest {
    const posts = publishedPosts(drafts, metricsByDraft)
    const summary = summarize(posts)
    const period = periodComparison(posts, 30, now)
    const features = extractAllFeatures(contentById, tzOffsetMinutes)
    const dna = analyzeContentDna(posts, features)

    const formats = formatBreakdown(posts)
        .slice(0, 6)
        .map((f) => ({ format: f.format, posts: f.count, avgEngagement: round(f.avgEngagement) }))

    const lengths = lengthBreakdown(posts)
        .filter((l) => l.count > 0)
        .map((l) => ({ range: l.label, posts: l.count, avgEngagement: round(l.avgEngagement) }))

    const days = dayOfWeekPerformance(posts, tzOffsetMinutes).filter((d) => d.count > 0)
    const bestDayStat = days
        .filter((d) => d.avgEngagement !== null)
        .sort((a, b) => (b.avgEngagement ?? 0) - (a.avgEngagement ?? 0))[0]
    const bestDay = bestDayStat ? { day: bestDayStat.label, avgEngagement: round(bestDayStat.avgEngagement) } : null

    const gh = goldenHour(posts, tzOffsetMinutes).best
    const bestTimeSlot = gh
        ? {
              day: DAY_NAMES[gh.day],
              time: TIME_BLOCKS[gh.block],
              avgEngagement: round(gh.avgEngagement) ?? 0,
              posts: gh.count,
          }
        : null

    return {
        overview: {
            publishedPosts: summary.publishedCount,
            postsWithMetrics: summary.postsWithMetrics,
            totalImpressions: summary.totalImpressions,
            totalEngagements: summary.totalEngagements,
            avgEngagementRatePct: round(summary.avgEngagementRate === null ? null : summary.avgEngagementRate * 100, 2),
            followersGained: summary.totalFollows,
        },
        last30Days: {
            posts: period.posts.current,
            impressions: period.impressions.current,
            engagements: period.engagements.current,
            engagementsDeltaPct: round(period.engagements.delta === null ? null : period.engagements.delta * 100),
        },
        formats,
        lengths,
        bestDay,
        bestTimeSlot,
        drivers: dna.drivers.map((d) => ({
            factor: `${d.dimension}: ${d.bucket}`,
            effectPct: Math.round(d.lift * 100),
            basedOnPosts: d.sampleSize,
        })),
        topPosts: topPosts(posts, 5).map((p) => ({
            title: p.entry.title || 'Untitled',
            engagement: p.engagement,
            impressions: p.impressions,
            opening: openingSnippet(contentById.get(p.entry.id)),
        })),
        dataQuality: { enoughForCorrelations: dna.hasEnoughData, analyzableSample: dna.sampleSize },
    }
}

function openingSnippet(content: PublishedPostContent | undefined): string {
    if (!content) return ''
    const text = content.plainText.replace(/\s+/g, ' ').trim()
    return text.length > 180 ? `${text.slice(0, 180)}…` : text
}

export type { PostFeatures }
