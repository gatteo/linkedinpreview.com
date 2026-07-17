'use client'

import { getIntensityClass } from '@/lib/strategy-metrics'
import type { HeatmapCell } from '@/lib/strategy-metrics'
import { cn } from '@/lib/utils'

type ContributionGridProps = {
    columns: HeatmapCell[][]
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
})

export function ContributionGrid({ columns }: ContributionGridProps) {
    return (
        <div className='flex gap-2'>
            {/* Day-of-week labels (every other row to save space) */}
            <div className='flex flex-col gap-1 pt-0.5'>
                {DAY_LABELS.map((label, i) => (
                    <div key={label} className='text-muted-foreground h-3 text-[9px] leading-3'>
                        {i % 2 === 1 ? label : ''}
                    </div>
                ))}
            </div>

            {/* Week columns, oldest left to newest right */}
            <div className='flex flex-1 gap-1 overflow-x-auto'>
                {columns.map((week, w) => (
                    <div key={w} className='flex flex-col gap-1'>
                        {week.map((cell) => {
                            const dateLabel = DATE_FORMATTER.format(new Date(cell.date))
                            const postLabel = `${cell.count} post${cell.count !== 1 ? 's' : ''}`
                            return (
                                <div
                                    key={cell.date}
                                    title={`${dateLabel}: ${postLabel}`}
                                    aria-label={`${dateLabel}: ${postLabel}`}
                                    className={cn('size-3 rounded-sm', getIntensityClass(cell.count))}
                                />
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
