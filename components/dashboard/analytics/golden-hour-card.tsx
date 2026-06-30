'use client'

import * as React from 'react'
import { ClockIcon } from 'lucide-react'

import type { PublishedPost } from '@/lib/analytics/aggregate'
import { goldenHour, TIME_BLOCKS } from '@/lib/analytics/aggregate'
import { formatCount } from '@/lib/analytics/format'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const BLOCK_SHORT = ['12a', '4a', '8a', '12p', '4p', '8p']

type GoldenHourCardProps = {
    posts: PublishedPost[]
}

function intensityClass(ratio: number): string {
    if (ratio >= 0.75) return 'bg-primary text-primary-foreground'
    if (ratio >= 0.5) return 'bg-primary/65'
    if (ratio >= 0.25) return 'bg-primary/40'
    return 'bg-primary/20'
}

export function GoldenHourCard({ posts }: GoldenHourCardProps) {
    const { cells, best } = React.useMemo(() => goldenHour(posts), [posts])

    const cellByKey = React.useMemo(() => {
        const map = new Map<string, (typeof cells)[number]>()
        for (const c of cells) map.set(`${c.day}-${c.block}`, c)
        return map
    }, [cells])

    const maxAvg = React.useMemo(() => Math.max(0, ...cells.map((c) => c.avgEngagement ?? 0)), [cells])

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle className='text-base'>Golden hour</CardTitle>
                <ClockIcon className='text-muted-foreground size-4' />
            </CardHeader>
            <CardContent className='space-y-4'>
                {best ? (
                    <p className='text-sm'>
                        Your strongest window is{' '}
                        <span className='font-semibold'>
                            {DAY_FULL[best.day]}s, {TIME_BLOCKS[best.block]}
                        </span>{' '}
                        <span className='text-muted-foreground'>
                            ({formatCount(Math.round(best.avgEngagement))} avg engagements)
                        </span>
                        .
                    </p>
                ) : (
                    <p className='text-muted-foreground text-sm'>
                        Add metrics to your posts to discover when your audience is most engaged.
                    </p>
                )}

                {/* day (rows) × time-block (cols) grid */}
                <div className='grid grid-cols-[2rem_repeat(6,1fr)] gap-1 text-center'>
                    <div />
                    {BLOCK_SHORT.map((b) => (
                        <div key={b} className='text-muted-foreground text-[9px]'>
                            {b}
                        </div>
                    ))}
                    {DAYS.map((day, d) => (
                        <React.Fragment key={day}>
                            <div className='text-muted-foreground flex items-center text-[9px]'>{day}</div>
                            {BLOCK_SHORT.map((_, b) => {
                                const cell = cellByKey.get(`${d}-${b}`)
                                const isBest = best?.day === d && best?.block === b
                                if (!cell) {
                                    return <div key={b} className='bg-muted/50 aspect-square rounded-sm' />
                                }
                                const ratio =
                                    maxAvg > 0 && cell.avgEngagement !== null ? cell.avgEngagement / maxAvg : 0
                                const label = `${DAY_FULL[d]} ${TIME_BLOCKS[b]}: ${cell.count} post${cell.count === 1 ? '' : 's'}${cell.avgEngagement !== null ? `, ${formatCount(Math.round(cell.avgEngagement))} avg engagements` : ''}`
                                return (
                                    <div
                                        key={b}
                                        title={label}
                                        aria-label={label}
                                        className={cn(
                                            'flex aspect-square items-center justify-center rounded-sm text-[9px] font-medium',
                                            cell.avgEngagement === null ? 'bg-primary/20' : intensityClass(ratio),
                                            isBest && 'ring-primary ring-2 ring-offset-1',
                                        )}>
                                        {cell.count > 1 ? cell.count : ''}
                                    </div>
                                )
                            })}
                        </React.Fragment>
                    ))}
                </div>
                <p className='text-muted-foreground text-[10px]'>
                    Cell shade = avg engagement · number = posts in that window
                </p>
            </CardContent>
        </Card>
    )
}
