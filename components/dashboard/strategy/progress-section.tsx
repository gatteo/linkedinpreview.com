'use client'

import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import type { DraftManifestEntry } from '@/lib/drafts'
import type { StrategyData } from '@/lib/strategy'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

import { ActivityHeatmap } from './activity-heatmap'
import { FormatTargets } from './format-targets'

type ProgressSectionProps = {
    strategy: StrategyData
    drafts: DraftManifestEntry[]
}

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

function getWeeksInMonth(year: number, month: number): number {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const firstDow = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    return Math.ceil((daysInMonth + firstDow) / 7)
}

export function ProgressSection({ strategy, drafts }: ProgressSectionProps) {
    const [selectedMonth, setSelectedMonth] = React.useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1)
    })

    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()

    const monthStart = new Date(year, month, 1).getTime()
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime()

    const monthDrafts = drafts.filter((d) => d.createdAt >= monthStart && d.createdAt <= monthEnd)

    const postsThisMonth = monthDrafts.length
    const weeksInMonth = getWeeksInMonth(year, month)
    const monthlyTarget = strategy.frequency * weeksInMonth

    // Posts by day-of-month
    const postsByDay: Record<number, number> = {}
    for (const draft of monthDrafts) {
        const day = new Date(draft.createdAt).getDate()
        postsByDay[day] = (postsByDay[day] ?? 0) + 1
    }

    // Posts by format label
    const postsByFormat: Record<string, number> = {}
    for (const draft of monthDrafts) {
        if (draft.label) {
            postsByFormat[draft.label] = (postsByFormat[draft.label] ?? 0) + 1
        }
    }

    const goToPrevMonth = () => {
        setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }

    const goToNextMonth = () => {
        setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }

    const progressPct = monthlyTarget > 0 ? Math.min(100, Math.round((postsThisMonth / monthlyTarget) * 100)) : 0

    return (
        <section>
            {/* Header */}
            <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-base font-semibold'>
                    Monthly Progress: {MONTH_NAMES[month]} {year}
                </h2>
                <div className='flex items-center gap-1'>
                    <Button variant='ghost' size='icon' onClick={goToPrevMonth} className='size-7'>
                        <ChevronLeftIcon className='size-4' />
                    </Button>
                    <Button variant='ghost' size='icon' onClick={goToNextMonth} className='size-7'>
                        <ChevronRightIcon className='size-4' />
                    </Button>
                </div>
            </div>

            {/* Three columns */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
                {/* Activity Targets */}
                <Card>
                    <CardHeader>
                        <p className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                            Activity Targets
                        </p>
                    </CardHeader>
                    <CardContent className='space-y-4 pb-4'>
                        <div className='flex items-end gap-2'>
                            <span className='text-3xl font-bold'>{postsThisMonth}</span>
                            <span className='text-muted-foreground mb-1 text-sm'>/ {monthlyTarget} posts</span>
                        </div>

                        <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                            <div
                                className='bg-primary h-full rounded-full transition-all duration-500'
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>

                        <p className='text-muted-foreground text-xs'>
                            {postsThisMonth >= monthlyTarget
                                ? 'Target reached!'
                                : `${monthlyTarget - postsThisMonth} more to reach your target`}
                        </p>
                    </CardContent>
                </Card>

                {/* Format Targets */}
                <Card>
                    <CardContent className='py-4'>
                        <FormatTargets
                            formats={strategy.formats}
                            monthlyTarget={monthlyTarget}
                            postsByFormat={postsByFormat}
                        />
                    </CardContent>
                </Card>

                {/* Monthly Activity Heatmap */}
                <Card>
                    <CardHeader>
                        <p className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                            Monthly Activity
                        </p>
                    </CardHeader>
                    <CardContent className='pb-4'>
                        <ActivityHeatmap year={year} month={month} postsByDay={postsByDay} />
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
