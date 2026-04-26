'use client'

import { cn } from '@/lib/utils'

type ActivityHeatmapProps = {
    year: number
    month: number // 0-indexed
    postsByDay: Record<number, number> // day-of-month (1-31) -> count
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getIntensityClass(count: number): string {
    if (count === 0) return 'bg-muted'
    if (count === 1) return 'bg-green-200 dark:bg-green-900'
    if (count === 2) return 'bg-green-400 dark:bg-green-700'
    return 'bg-green-600 dark:bg-green-500'
}

export function ActivityHeatmap({ year, month, postsByDay }: ActivityHeatmapProps) {
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startDow = firstDay.getDay() // 0=Sun

    // Build grid cells: leading empty cells + day cells
    const cells: Array<{ day: number | null }> = []
    for (let i = 0; i < startDow; i++) {
        cells.push({ day: null })
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d })
    }

    return (
        <div>
            {/* Day header */}
            <div className='mb-1.5 grid grid-cols-7 gap-1'>
                {DAY_LABELS.map((label) => (
                    <div key={label} className='text-muted-foreground text-center text-[10px]'>
                        {label}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className='grid grid-cols-7 gap-1'>
                {cells.map((cell, i) => {
                    if (cell.day === null) {
                        return <div key={`empty-${i}`} className='size-4 rounded-sm' />
                    }
                    const count = postsByDay[cell.day] ?? 0
                    return (
                        <div
                            key={cell.day}
                            title={`Day ${cell.day}: ${count} post${count !== 1 ? 's' : ''}`}
                            className={cn('size-4 rounded-sm', getIntensityClass(count))}
                        />
                    )
                })}
            </div>
        </div>
    )
}
