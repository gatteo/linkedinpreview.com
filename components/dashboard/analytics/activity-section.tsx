'use client'

import * as React from 'react'
import { AlertTriangleIcon, ClockIcon, FileEditIcon, FlameIcon, SendIcon } from 'lucide-react'

import type { PublishedPost, StatusCounts } from '@/lib/analytics/aggregate'
import { buildHeatmapColumns, computeWeeklyStreak } from '@/lib/strategy-metrics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContributionGrid } from '@/components/dashboard/strategy/contribution-grid'

type ActivitySectionProps = {
    posts: PublishedPost[]
    funnel: StatusCounts
}

const FUNNEL_ITEMS: { key: keyof StatusCounts; label: string; icon: typeof FileEditIcon }[] = [
    { key: 'draft', label: 'Drafts', icon: FileEditIcon },
    { key: 'scheduled', label: 'Scheduled', icon: ClockIcon },
    { key: 'published', label: 'Published', icon: SendIcon },
    { key: 'failed', label: 'Failed', icon: AlertTriangleIcon },
]

export function ActivitySection({ posts, funnel }: ActivitySectionProps) {
    const publishedDates = React.useMemo(() => posts.map((p) => p.publishedAt), [posts])
    const heatmapColumns = React.useMemo(() => buildHeatmapColumns(publishedDates), [publishedDates])
    const streak = React.useMemo(() => computeWeeklyStreak(publishedDates), [publishedDates])

    return (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            {/* Publish funnel */}
            <Card>
                <CardHeader>
                    <CardTitle className='text-base'>Pipeline</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                    {FUNNEL_ITEMS.map((item) => (
                        <div key={item.key} className='flex items-center justify-between'>
                            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                                <item.icon className='size-4' />
                                <span>{item.label}</span>
                            </div>
                            <span className='font-semibold tabular-nums'>{funnel[item.key]}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Posting cadence */}
            <Card className='lg:col-span-2'>
                <CardHeader className='flex flex-row items-center justify-between'>
                    <CardTitle className='text-base'>Publishing activity</CardTitle>
                    <span className='text-muted-foreground flex items-center gap-1 text-xs'>
                        <FlameIcon className='size-3.5' />
                        {streak > 0 ? `${streak} week streak` : 'No active streak'}
                    </span>
                </CardHeader>
                <CardContent>
                    {publishedDates.length === 0 ? (
                        <p className='text-muted-foreground py-8 text-center text-sm'>No published posts yet.</p>
                    ) : (
                        <ContributionGrid columns={heatmapColumns} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
