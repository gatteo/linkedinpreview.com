'use client'

import * as React from 'react'
import {
    ArrowRightIcon,
    FlaskConicalIcon,
    LightbulbIcon,
    Loader2Icon,
    RefreshCwIcon,
    SparklesIcon,
    TriangleAlertIcon,
    TrophyIcon,
    WandSparklesIcon,
    type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { ApiRoutes } from '@/config/routes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/components/dashboard/auth-provider'

type InsightKind = 'win' | 'opportunity' | 'experiment' | 'warning'

type Insight = { kind: InsightKind; title: string; detail: string; action?: string }
type InsightsResult = { headline: string; insights: Insight[]; nextPost: { recommendation: string } }

const KIND_STYLE: Record<InsightKind, { icon: LucideIcon; ring: string; chip: string; label: string }> = {
    win: {
        icon: TrophyIcon,
        ring: 'text-emerald-500',
        chip: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        label: 'Win',
    },
    opportunity: {
        icon: LightbulbIcon,
        ring: 'text-blue-500',
        chip: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        label: 'Opportunity',
    },
    experiment: {
        icon: FlaskConicalIcon,
        ring: 'text-violet-500',
        chip: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        label: 'Experiment',
    },
    warning: {
        icon: TriangleAlertIcon,
        ring: 'text-amber-500',
        chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        label: 'Watch out',
    },
}

function timeAgo(ms: number): string {
    const mins = Math.round((Date.now() - ms) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.round(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.round(hours / 24)}d ago`
}

export function AiInsightsSection() {
    const { userId } = useAuth()
    const [result, setResult] = React.useState<InsightsResult | null>(null)
    const [generatedAt, setGeneratedAt] = React.useState<number | null>(null)
    const [loading, setLoading] = React.useState(false)

    // Load the last generated insights (persisted server-side, so they show
    // across devices) once the session is ready.
    React.useEffect(() => {
        if (!userId) return
        let cancelled = false
        fetch(ApiRoutes.AnalyticsInsights)
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { insights?: InsightsResult | null; generatedAt?: number | null } | null) => {
                if (cancelled || !data?.insights) return
                setResult(data.insights)
                setGeneratedAt(data.generatedAt ?? null)
            })
            .catch(() => {
                // Non-fatal: the member can still generate fresh insights.
            })
        return () => {
            cancelled = true
        }
    }, [userId])

    const generate = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(ApiRoutes.AnalyticsInsights, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tzOffsetMinutes: new Date().getTimezoneOffset() }),
            })
            const data = (await res.json().catch(() => ({}))) as {
                success?: boolean
                insights?: InsightsResult
                generatedAt?: number
                notEnoughData?: boolean
                error?: string
            }

            if (res.status === 429) {
                toast.error(data.error ?? 'Daily insights limit reached')
                return
            }
            if (!res.ok || !data.success) {
                toast.error(data.error ?? 'Failed to generate insights')
                return
            }
            if (data.notEnoughData || !data.insights) {
                toast.message('Publish a few more posts to unlock AI insights')
                return
            }

            setResult(data.insights)
            setGeneratedAt(data.generatedAt ?? Date.now())
        } catch {
            toast.error('Failed to generate insights')
        } finally {
            setLoading(false)
        }
    }, [])

    return (
        <div className='border-border relative overflow-hidden rounded-xl border'>
            {/* Gradient header */}
            <div className='relative bg-gradient-to-br from-violet-500/10 via-blue-500/5 to-transparent p-4'>
                <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-center gap-2.5'>
                        <div className='flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-sm'>
                            <SparklesIcon className='size-4' />
                        </div>
                        <div>
                            <h2 className='text-base leading-tight font-semibold'>AI Insights</h2>
                            <p className='text-muted-foreground text-xs'>
                                {generatedAt
                                    ? `Updated ${timeAgo(generatedAt)}`
                                    : 'Your personal LinkedIn growth coach'}
                            </p>
                        </div>
                    </div>
                    <Button size='sm' variant={result ? 'outline' : 'default'} onClick={generate} disabled={loading}>
                        {loading ? (
                            <Loader2Icon className='size-3.5 animate-spin' />
                        ) : result ? (
                            <RefreshCwIcon className='size-3.5' />
                        ) : (
                            <WandSparklesIcon className='size-3.5' />
                        )}
                        {loading ? 'Analyzing…' : result ? 'Refresh' : 'Generate insights'}
                    </Button>
                </div>
            </div>

            <div className='p-4 pt-0'>
                {loading && !result ? (
                    <div className='space-y-3'>
                        <Skeleton className='h-5 w-2/3' />
                        <div className='grid gap-3 sm:grid-cols-2'>
                            {[0, 1, 2, 3].map((i) => (
                                <Skeleton key={i} className='h-24 rounded-lg' />
                            ))}
                        </div>
                    </div>
                ) : result ? (
                    <div className='space-y-4'>
                        <p className='text-sm font-medium'>{result.headline}</p>

                        <div className='grid gap-3 sm:grid-cols-2'>
                            {result.insights.map((insight, i) => {
                                const style = KIND_STYLE[insight.kind]
                                const Icon = style.icon
                                return (
                                    <div key={i} className='border-border bg-card/50 rounded-lg border p-3'>
                                        <div className='mb-1.5 flex items-center gap-2'>
                                            <Icon className={cn('size-4 shrink-0', style.ring)} />
                                            <span className='text-sm font-semibold'>{insight.title}</span>
                                            <span
                                                className={cn(
                                                    'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                                                    style.chip,
                                                )}>
                                                {style.label}
                                            </span>
                                        </div>
                                        <p className='text-muted-foreground text-xs leading-relaxed'>
                                            {insight.detail}
                                        </p>
                                        {insight.action && (
                                            <p className='mt-2 flex items-start gap-1.5 text-xs font-medium'>
                                                <ArrowRightIcon className='text-primary mt-0.5 size-3 shrink-0' />
                                                {insight.action}
                                            </p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className='from-primary/10 rounded-lg bg-gradient-to-r to-transparent p-3'>
                            <p className='text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase'>
                                Your next post
                            </p>
                            <p className='text-sm'>{result.nextPost.recommendation}</p>
                        </div>
                    </div>
                ) : (
                    <div className='py-6 text-center'>
                        <p className='text-muted-foreground mx-auto max-w-sm text-sm'>
                            Get AI-generated insights on what drives your engagement, what to double down on, and
                            exactly what to post next, all grounded in your own data.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
