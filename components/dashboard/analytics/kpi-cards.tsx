'use client'

import * as React from 'react'
import { BarChart3Icon, EyeIcon, HeartIcon, PercentIcon } from 'lucide-react'

import type { PublishedPost } from '@/lib/analytics/aggregate'
import { periodComparison, summarize } from '@/lib/analytics/aggregate'
import { formatCount, formatExact, formatPercent } from '@/lib/analytics/format'

import { StatCard } from './stat-card'

type KpiCardsProps = {
    posts: PublishedPost[]
    now: number
}

export function KpiCards({ posts, now }: KpiCardsProps) {
    const summary = React.useMemo(() => summarize(posts), [posts])
    const period = React.useMemo(() => periodComparison(posts, 30, now), [posts, now])

    // Chronological series for the per-card sparklines (known values only).
    const series = React.useMemo(() => {
        const chrono = [...posts].sort((a, b) => a.publishedAt - b.publishedAt)
        return {
            impressions: chrono.map((p) => p.impressions).filter((v): v is number => v !== null),
            engagement: chrono.map((p) => p.engagement).filter((v): v is number => v !== null),
            rate: chrono
                .map((p) => p.engagementRate)
                .filter((v): v is number => v !== null)
                .map((r) => r * 100),
        }
    }, [posts])

    return (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <StatCard
                label='Published'
                value={summary.publishedCount}
                format={formatExact}
                hint={summary.postsWithMetrics > 0 ? `${summary.postsWithMetrics} with metrics` : 'Add metrics'}
                icon={BarChart3Icon}
                accent='blue'
                delta={period.posts.delta}
            />
            <StatCard
                label='Impressions'
                value={summary.totalImpressions}
                format={formatCount}
                hint='all time'
                icon={EyeIcon}
                accent='violet'
                delta={period.impressions.delta}
                spark={series.impressions}
            />
            <StatCard
                label='Engagements'
                value={summary.totalEngagements}
                format={formatCount}
                hint='reactions + comments + reposts'
                icon={HeartIcon}
                accent='emerald'
                delta={period.engagements.delta}
                spark={series.engagement}
            />
            <StatCard
                label='Avg eng. rate'
                value={summary.avgEngagementRate}
                format={(n) => formatPercent(n)}
                hint='per post'
                icon={PercentIcon}
                accent='amber'
                delta={period.engagementRate.delta}
                spark={series.rate}
            />
        </div>
    )
}
