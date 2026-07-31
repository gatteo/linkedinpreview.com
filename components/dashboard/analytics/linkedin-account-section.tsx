'use client'

import * as React from 'react'
import { EyeIcon, HeartIcon, LinkedinIcon, MessageCircleIcon, RefreshCwIcon, Share2Icon, UsersIcon } from 'lucide-react'
import posthog from 'posthog-js'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { ApiRoutes } from '@/config/routes'
import { formatCount, formatShortDate } from '@/lib/analytics/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/dashboard/auth-provider'

import { SectionHeading } from './section-heading'
import { StatCard } from './stat-card'

const WINDOWS = [
    { key: '30', label: '30 days', days: 30 },
    { key: '90', label: '90 days', days: 90 },
] as const

type WindowKey = (typeof WINDOWS)[number]['key']

type AggregateKpis = {
    impressions: number | null
    reach: number | null
    reactions: number | null
    comments: number | null
    reshares: number | null
}

type LinkedInAnalyticsResponse = {
    configured: boolean
    connected: boolean
    testMode: boolean
    days?: number
    followers?: { lifetime: number | null; series: { dateMs: number; count: number }[] }
    aggregate?: AggregateKpis
    error?: string
}

type Status = 'loading' | 'hidden' | 'error' | 'ready'

const followerChartConfig = {
    followers: { label: 'Followers', color: 'var(--chart-3)' },
} satisfies ChartConfig

/**
 * Account-wide LinkedIn analytics (follower growth + aggregate KPIs), sourced
 * from the analytics app (App B) once a member connects it - or from
 * deterministic test data when `LINKEDIN_ANALYTICS_TEST_MODE` is set. Renders
 * nothing until the connection (or test mode) is confirmed, so it never flashes
 * a connect prompt on top of the rest of the dashboard.
 */
export function LinkedInAccountSection() {
    const { userId } = useAuth()
    const [status, setStatus] = React.useState<Status>('loading')
    const [data, setData] = React.useState<LinkedInAnalyticsResponse | null>(null)
    const [range, setRange] = React.useState<WindowKey>('30')

    const load = React.useCallback(
        (days: number) => {
            if (!userId) return
            setStatus((prev) => (prev === 'ready' ? prev : 'loading'))
            fetch(`${ApiRoutes.AnalyticsLinkedIn}?days=${days}`)
                .then(async (res) => {
                    // A non-OK response is a real failure (LinkedIn call errored) -
                    // distinct from a 200 with `connected: false`, which just means
                    // the member hasn't linked App B yet and the section self-hides.
                    if (!res.ok) {
                        setStatus('error')
                        return
                    }
                    const json = (await res.json().catch(() => ({}))) as LinkedInAnalyticsResponse
                    if (!json.connected) {
                        setStatus('hidden')
                        return
                    }
                    setData(json)
                    setStatus('ready')
                    posthog?.capture('linkedin_account_analytics_viewed', { test_mode: json.testMode, days })
                })
                .catch(() => setStatus('error'))
        },
        [userId],
    )

    React.useEffect(() => {
        const days = WINDOWS.find((w) => w.key === range)?.days ?? 30
        load(days)
    }, [load, range])

    if (status === 'hidden') return null

    return (
        <section className='space-y-4'>
            <SectionHeading icon={LinkedinIcon} title='LinkedIn account analytics' subtitle='Straight from LinkedIn'>
                <div className='flex items-center gap-2'>
                    {data?.testMode && (
                        <Badge variant='outline' className='text-muted-foreground'>
                            Test data
                        </Badge>
                    )}
                    <Tabs value={range} onValueChange={(v) => setRange(v as WindowKey)}>
                        <TabsList>
                            {WINDOWS.map((w) => (
                                <TabsTrigger key={w.key} value={w.key} className='text-xs'>
                                    {w.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            </SectionHeading>

            {status === 'loading' && (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className='h-28 rounded-xl' />
                    ))}
                </div>
            )}

            {status === 'error' && (
                <Card>
                    <CardContent className='flex flex-col items-center gap-3 py-8 text-center'>
                        <p className='text-muted-foreground text-sm'>
                            Couldn't load your LinkedIn account analytics right now.
                        </p>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                                posthog?.capture('linkedin_account_analytics_retry_clicked')
                                load(WINDOWS.find((w) => w.key === range)?.days ?? 30)
                            }}>
                            <RefreshCwIcon className='size-3.5' />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {status === 'ready' && data?.aggregate && (
                <>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
                        <StatCard
                            label='Impressions'
                            value={data.aggregate.impressions}
                            format={formatCount}
                            icon={EyeIcon}
                            accent='violet'
                        />
                        <StatCard
                            label='Reach'
                            value={data.aggregate.reach}
                            format={formatCount}
                            icon={UsersIcon}
                            accent='blue'
                        />
                        <StatCard
                            label='Reactions'
                            value={data.aggregate.reactions}
                            format={formatCount}
                            icon={HeartIcon}
                            accent='emerald'
                        />
                        <StatCard
                            label='Comments'
                            value={data.aggregate.comments}
                            format={formatCount}
                            icon={MessageCircleIcon}
                            accent='amber'
                        />
                        <StatCard
                            label='Reshares'
                            value={data.aggregate.reshares}
                            format={formatCount}
                            icon={Share2Icon}
                            accent='violet'
                        />
                    </div>

                    <FollowerChart lifetime={data.followers?.lifetime ?? null} series={data.followers?.series ?? []} />
                </>
            )}
        </section>
    )
}

function FollowerChart({ lifetime, series }: { lifetime: number | null; series: { dateMs: number; count: number }[] }) {
    const chartData = React.useMemo(() => series.map((p) => ({ ...p, dateLabel: formatShortDate(p.dateMs) })), [series])

    return (
        <Card>
            <CardContent className='space-y-1'>
                <div className='flex items-baseline justify-between'>
                    <p className='text-sm font-medium'>Follower growth</p>
                    {lifetime !== null && (
                        <p className='text-muted-foreground text-xs'>
                            <span className='text-foreground font-semibold'>{formatCount(lifetime)}</span> total
                            followers
                        </p>
                    )}
                </div>
                {chartData.length < 2 ? (
                    <div className='text-muted-foreground flex h-48 items-center justify-center text-center text-sm'>
                        Not enough data yet for this range.
                    </div>
                ) : (
                    <ChartContainer config={followerChartConfig} className='aspect-auto h-48 w-full'>
                        <AreaChart data={chartData} margin={{ left: 4, right: 12, top: 8 }}>
                            <defs>
                                <linearGradient id='fillFollowers' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='5%' stopColor='var(--color-followers)' stopOpacity={0.3} />
                                    <stop offset='95%' stopColor='var(--color-followers)' stopOpacity={0.02} />
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
                            <YAxis tickLine={false} axisLine={false} width={36} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                                type='monotone'
                                dataKey='count'
                                name='Followers'
                                stroke='var(--color-followers)'
                                fill='url(#fillFollowers)'
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    )
}
