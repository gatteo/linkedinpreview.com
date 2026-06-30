'use client'

import { ArrowDownRightIcon, ArrowUpRightIcon, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

import { AnimatedNumber } from './animated-number'
import { Sparkline } from './sparkline'

export type Accent = 'blue' | 'violet' | 'emerald' | 'amber'

const ACCENTS: Record<Accent, { icon: string; spark: string; glow: string }> = {
    blue: {
        icon: 'bg-[var(--chart-1)]/10 text-[color:var(--chart-1)]',
        spark: 'oklch(0.29 0.045 218)',
        glow: 'from-[var(--chart-1)]/10',
    },
    violet: {
        icon: 'bg-[var(--chart-2)]/10 text-[color:var(--chart-2)]',
        spark: 'oklch(0.52 0.055 212)',
        glow: 'from-[var(--chart-2)]/10',
    },
    emerald: {
        icon: 'bg-[var(--chart-4)]/10 text-[color:var(--chart-4)]',
        spark: 'oklch(0.77 0.125 42)',
        glow: 'from-[var(--chart-4)]/10',
    },
    amber: {
        icon: 'bg-[var(--chart-5)]/10 text-[color:var(--chart-5)]',
        spark: 'oklch(0.64 0.15 39)',
        glow: 'from-[var(--chart-5)]/10',
    },
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
                                delta >= 0 ? 'bg-success/15 text-success' : 'bg-error/15 text-error',
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
