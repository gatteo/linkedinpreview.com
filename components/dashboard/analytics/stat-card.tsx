'use client'

import { ArrowDownRightIcon, ArrowUpRightIcon, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

import { AnimatedNumber } from './animated-number'
import { Sparkline } from './sparkline'

export type Accent = 'blue' | 'violet' | 'emerald' | 'amber'

const ACCENTS: Record<Accent, { icon: string; spark: string; glow: string }> = {
    blue: { icon: 'bg-blue-500/10 text-blue-500', spark: '#3b82f6', glow: 'from-blue-500/10' },
    violet: { icon: 'bg-violet-500/10 text-violet-500', spark: '#8b5cf6', glow: 'from-violet-500/10' },
    emerald: { icon: 'bg-emerald-500/10 text-emerald-500', spark: '#10b981', glow: 'from-emerald-500/10' },
    amber: { icon: 'bg-amber-500/10 text-amber-500', spark: '#f59e0b', glow: 'from-amber-500/10' },
}

type StatCardProps = {
    label: string
    value: number | null
    format: (n: number) => string
    hint?: string
    icon: LucideIcon
    accent: Accent
    /** Fractional change vs previous period (e.g. 0.18 = +18%). */
    delta?: number | null
    /** Short numeric series for the sparkline. */
    spark?: number[]
}

export function StatCard({ label, value, format, hint, icon: Icon, accent, delta, spark }: StatCardProps) {
    const colors = ACCENTS[accent]

    return (
        <Card className='relative overflow-hidden'>
            {/* Soft corner glow */}
            <div
                className={cn(
                    'pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-gradient-to-br to-transparent blur-2xl',
                    colors.glow,
                )}
            />

            <div className='relative flex flex-col gap-3 px-4'>
                <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                        {label}
                    </span>
                    <div className={cn('flex size-7 items-center justify-center rounded-lg', colors.icon)}>
                        <Icon className='size-4' />
                    </div>
                </div>

                <div className='flex items-end justify-between gap-2'>
                    <p className='text-3xl font-bold'>
                        {value === null ? (
                            <span className='text-muted-foreground'>—</span>
                        ) : (
                            <AnimatedNumber value={value} format={format} />
                        )}
                    </p>
                    {spark && spark.length >= 2 && (
                        <Sparkline data={spark} color={colors.spark} className='mb-1 shrink-0' />
                    )}
                </div>

                <div className='flex items-center gap-2'>
                    {delta !== null && delta !== undefined && (
                        <span
                            className={cn(
                                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
                                delta >= 0
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400',
                            )}>
                            {delta >= 0 ? (
                                <ArrowUpRightIcon className='size-3' />
                            ) : (
                                <ArrowDownRightIcon className='size-3' />
                            )}
                            {Math.abs(Math.round(delta * 100))}%
                        </span>
                    )}
                    {hint && <span className='text-muted-foreground text-xs'>{hint}</span>}
                </div>
            </div>
        </Card>
    )
}
