'use client'

import * as React from 'react'

import type { PublishedPost } from '@/lib/analytics/aggregate'
import { dayOfWeekPerformance, formatBreakdown, lengthBreakdown } from '@/lib/analytics/aggregate'
import { formatCount } from '@/lib/analytics/format'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ContentInsightsProps = {
    posts: PublishedPost[]
}

type Row = { label: string; count: number; engagement: number | null }

export function ContentInsights({ posts }: ContentInsightsProps) {
    const formats = React.useMemo<Row[]>(
        () => formatBreakdown(posts).map((f) => ({ label: f.format, count: f.count, engagement: f.avgEngagement })),
        [posts],
    )
    const lengths = React.useMemo<Row[]>(
        () => lengthBreakdown(posts).map((l) => ({ label: l.label, count: l.count, engagement: l.avgEngagement })),
        [posts],
    )
    const days = React.useMemo<Row[]>(
        () => dayOfWeekPerformance(posts).map((d) => ({ label: d.label, count: d.count, engagement: d.avgEngagement })),
        [posts],
    )

    return (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <InsightCard title='Top formats' rows={formats} emptyHint='Label your posts to compare formats.' />
            <InsightCard title='Post length' rows={lengths} />
            <InsightCard
                title='Best day to post'
                rows={days}
                footer='General guidance: weekday mornings, with Tue-Thu strongest.'
            />
        </div>
    )
}

function InsightCard({
    title,
    rows,
    emptyHint,
    footer,
}: {
    title: string
    rows: Row[]
    emptyHint?: string
    footer?: string
}) {
    // Prefer ranking by engagement once any post has data; otherwise fall back to
    // post volume so the card is still useful before metrics are entered.
    const useEngagement = rows.some((r) => r.engagement !== null)
    const metric = (r: Row) => (useEngagement ? (r.engagement ?? 0) : r.count)
    const visible = rows.filter((r) => r.count > 0)
    const max = Math.max(1, ...visible.map(metric))
    const ranked = [...visible].sort((a, b) => metric(b) - metric(a))

    return (
        <Card>
            <CardHeader>
                <CardTitle className='text-base'>{title}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
                {ranked.length === 0 ? (
                    <p className='text-muted-foreground py-6 text-center text-xs'>{emptyHint ?? 'No data yet.'}</p>
                ) : (
                    <>
                        <p className='text-muted-foreground text-xs'>
                            Ranked by {useEngagement ? 'avg engagement' : 'posts published'}
                        </p>
                        <ul className='space-y-2.5'>
                            {ranked.map((row, i) => (
                                <li key={row.label} className='space-y-1'>
                                    <div className='flex items-center justify-between text-xs'>
                                        <span className='truncate pr-2'>{row.label}</span>
                                        <span className='text-muted-foreground tabular-nums'>
                                            {useEngagement
                                                ? `${formatCount(row.engagement)} avg`
                                                : `${row.count} post${row.count === 1 ? '' : 's'}`}
                                        </span>
                                    </div>
                                    <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                                        <div
                                            className={cn(
                                                'h-full rounded-full',
                                                i === 0 ? 'bg-primary' : 'bg-primary/40',
                                            )}
                                            style={{ width: `${Math.max(4, (metric(row) / max) * 100)}%` }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                {footer && <p className='text-muted-foreground border-t pt-3 text-xs'>{footer}</p>}
            </CardContent>
        </Card>
    )
}
