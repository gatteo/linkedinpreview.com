'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from 'recharts'

import type { PublishedPost } from '@/lib/analytics/aggregate'
import { engagementTimeline } from '@/lib/analytics/aggregate'
import { formatShortDate } from '@/lib/analytics/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const RANGES = [
    { key: '30', label: '30 days', days: 30 },
    { key: '90', label: '90 days', days: 90 },
    { key: 'all', label: 'All time', days: null },
] as const

type RangeKey = (typeof RANGES)[number]['key']

const chartConfig = {
    engagement: { label: 'Engagement', color: 'var(--chart-1)' },
    impressions: { label: 'Impressions', color: 'var(--chart-2)' },
} satisfies ChartConfig

type EngagementTrendChartProps = {
    posts: PublishedPost[]
    now?: number
}

export function EngagementTrendChart({ posts, now }: EngagementTrendChartProps) {
    const [range, setRange] = React.useState<RangeKey>('90')
    // Pin "now" once per mount so range filtering stays stable across re-renders
    // (and to keep render pure - no Date.now() call in the render path).
    const [pinnedNow] = React.useState(() => now ?? Date.now())

    const data = React.useMemo(() => {
        const days = RANGES.find((r) => r.key === range)?.days ?? null
        const since = days === null ? undefined : pinnedNow - days * 24 * 60 * 60 * 1000
        return engagementTimeline(posts, since).map((p) => ({ ...p, dateLabel: formatShortDate(p.date) }))
    }, [posts, range, pinnedNow])

    const hasMetricData = data.some((p) => p.engagement !== null || p.impressions !== null)

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle className='text-base'>Engagement over time</CardTitle>
                <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
                    <TabsList>
                        {RANGES.map((r) => (
                            <TabsTrigger key={r.key} value={r.key} className='text-xs'>
                                {r.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <EmptyChart message='No posts published in this range.' />
                ) : !hasMetricData ? (
                    <EmptyChart message='Add performance metrics to your posts to see the trend.' />
                ) : (
                    <ChartContainer config={chartConfig} className='aspect-auto h-64 w-full'>
                        <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
                            <defs>
                                <linearGradient id='fillEngagement' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='5%' stopColor='var(--color-engagement)' stopOpacity={0.3} />
                                    <stop offset='95%' stopColor='var(--color-engagement)' stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey='dateLabel'
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={24}
                            />
                            <YAxis yAxisId='left' tickLine={false} axisLine={false} width={36} />
                            <YAxis yAxisId='right' orientation='right' tickLine={false} axisLine={false} width={36} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                                yAxisId='left'
                                type='monotone'
                                dataKey='engagement'
                                stroke='var(--color-engagement)'
                                fill='url(#fillEngagement)'
                                strokeWidth={2}
                                connectNulls
                            />
                            <Line
                                yAxisId='right'
                                type='monotone'
                                dataKey='impressions'
                                stroke='var(--color-impressions)'
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    )
}

function EmptyChart({ message }: { message: string }) {
    return (
        <div className='text-muted-foreground flex h-64 items-center justify-center text-center text-sm'>{message}</div>
    )
}
