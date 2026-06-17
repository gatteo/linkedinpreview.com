'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
    addMonths,
    addWeeks,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    isToday,
    setHours,
    setMinutes,
    startOfMonth,
    startOfWeek,
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { toast } from 'sonner'

import { BEST_TIME_SLOTS, BEST_TIME_SUMMARY } from '@/config/best-time'
import { Routes } from '@/config/routes'
import { type DraftManifestEntry, type DraftStatus } from '@/lib/drafts'
import { setDraftSchedule } from '@/lib/supabase/drafts'
import { cn } from '@/lib/utils'
import { useDrafts } from '@/hooks/use-drafts'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/dashboard/auth-provider'

type View = 'month' | 'week'

const STATUS_DOT: Record<DraftStatus, string> = {
    draft: 'bg-amber-500',
    scheduled: 'bg-blue-500',
    published: 'bg-green-500',
    failed: 'bg-red-500',
}

const STATUS_CHIP: Record<DraftStatus, string> = {
    draft: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200',
    scheduled:
        'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-200',
    published:
        'border-green-300 bg-green-50 text-green-900 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-200',
    failed: 'border-red-300 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200',
}

const BEST_DAYS = new Set(BEST_TIME_SLOTS.filter((s) => s.tier === 'best').map((s) => s.day))

/** The date a post is laid out on: published date, else scheduled date. */
function postDate(d: DraftManifestEntry): number | null {
    if (d.status === 'published' && d.publishedAt) return d.publishedAt
    if (d.scheduledAt) return d.scheduledAt
    return null
}

export function ContentCalendar() {
    const router = useRouter()
    const { supabase } = useAuth()
    const { drafts, isLoading } = useDrafts()
    const [view, setView] = React.useState<View>('month')
    const [cursor, setCursor] = React.useState<Date>(() => new Date())
    const [items, setItems] = React.useState<DraftManifestEntry[]>([])
    const [dragId, setDragId] = React.useState<string | null>(null)

    // Mirror drafts locally so drag-to-reschedule can update optimistically.
    React.useEffect(() => {
        setItems(drafts)
    }, [drafts])

    const days = React.useMemo(() => {
        if (view === 'week') {
            const start = startOfWeek(cursor)
            return eachDayOfInterval({ start, end: endOfWeek(cursor) })
        }
        const start = startOfWeek(startOfMonth(cursor))
        const end = endOfWeek(endOfMonth(cursor))
        return eachDayOfInterval({ start, end })
    }, [cursor, view])

    const byDay = React.useMemo(() => {
        const map = new Map<string, DraftManifestEntry[]>()
        for (const item of items) {
            const ts = postDate(item)
            if (ts === null) continue
            const key = format(new Date(ts), 'yyyy-MM-dd')
            const list = map.get(key) ?? []
            list.push(item)
            map.set(key, list)
        }
        for (const list of map.values()) list.sort((a, b) => (postDate(a) ?? 0) - (postDate(b) ?? 0))
        return map
    }, [items])

    const goPrev = () => setCursor((c) => (view === 'week' ? addWeeks(c, -1) : addMonths(c, -1)))
    const goNext = () => setCursor((c) => (view === 'week' ? addWeeks(c, 1) : addMonths(c, 1)))
    const goToday = () => setCursor(new Date())

    const handleDrop = React.useCallback(
        async (day: Date) => {
            const id = dragId
            setDragId(null)
            if (!id) return
            const item = items.find((d) => d.id === id)
            if (!item) return
            // Only future-dated, unpublished posts can be rescheduled.
            if (item.status === 'published') {
                toast.error('Published posts cannot be rescheduled')
                return
            }
            // Preserve the original time of day, defaulting to 4pm (a recommended slot).
            const original = item.scheduledAt ? new Date(item.scheduledAt) : null
            const target = setMinutes(setHours(day, original?.getHours() ?? 16), original?.getMinutes() ?? 0)
            if (target.getTime() <= Date.now()) {
                toast.error('Pick a future date')
                return
            }
            const ts = target.getTime()
            const prev = items
            setItems((list) => list.map((d) => (d.id === id ? { ...d, status: 'scheduled', scheduledAt: ts } : d)))
            try {
                await setDraftSchedule(supabase, id, ts)
                toast.success(`Rescheduled to ${format(target, 'MMM d, h:mm a')}`)
            } catch {
                setItems(prev)
                toast.error('Failed to reschedule')
            }
        },
        [dragId, items, supabase],
    )

    const title =
        view === 'week' ? `Week of ${format(startOfWeek(cursor), 'MMM d, yyyy')}` : format(cursor, 'MMMM yyyy')

    return (
        <div className='flex flex-col gap-4 p-4 lg:p-6'>
            {/* Toolbar */}
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <div className='flex items-center gap-2'>
                    <Button variant='outline' size='icon' className='size-8' aria-label='Previous' onClick={goPrev}>
                        <ChevronLeftIcon className='size-4' />
                    </Button>
                    <Button variant='outline' size='icon' className='size-8' aria-label='Next' onClick={goNext}>
                        <ChevronRightIcon className='size-4' />
                    </Button>
                    <Button variant='outline' size='sm' onClick={goToday}>
                        Today
                    </Button>
                    <h2 className='ml-1 text-sm font-semibold sm:text-base'>{title}</h2>
                </div>
                <div className='flex items-center gap-1'>
                    <Button
                        variant={view === 'month' ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => setView('month')}>
                        Month
                    </Button>
                    <Button variant={view === 'week' ? 'default' : 'outline'} size='sm' onClick={() => setView('week')}>
                        Week
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <div className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs'>
                {(['scheduled', 'published', 'failed', 'draft'] as DraftStatus[]).map((s) => (
                    <span key={s} className='flex items-center gap-1.5 capitalize'>
                        <span className={cn('size-2 rounded-full', STATUS_DOT[s])} />
                        {s}
                    </span>
                ))}
                <span className='hidden sm:inline'>· {BEST_TIME_SUMMARY}</span>
            </div>

            {/* Weekday headers */}
            <div className='grid grid-cols-7 gap-px'>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className='text-muted-foreground px-1 pb-1 text-center text-[11px] font-medium'>
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className='bg-border grid grid-cols-7 gap-px overflow-hidden rounded-lg border'>
                {days.map((day) => {
                    const key = format(day, 'yyyy-MM-dd')
                    const dayItems = byDay.get(key) ?? []
                    const inMonth = view === 'week' || isSameMonth(day, cursor)
                    const isBestDay = BEST_DAYS.has(day.getDay())
                    return (
                        <div
                            key={key}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(day)}
                            className={cn(
                                'bg-background min-h-24 p-1.5 lg:min-h-28',
                                !inMonth && 'bg-muted/40',
                                view === 'week' && 'min-h-64',
                            )}>
                            <div className='mb-1 flex items-center justify-between'>
                                <span
                                    className={cn(
                                        'flex size-6 items-center justify-center rounded-full text-xs',
                                        isToday(day) && 'bg-primary text-primary-foreground font-semibold',
                                        !inMonth && 'text-muted-foreground',
                                    )}>
                                    {format(day, 'd')}
                                </span>
                                {isBestDay && inMonth && (
                                    <span
                                        className='text-[9px] text-green-600 dark:text-green-500'
                                        title='Good day to post'>
                                        ●
                                    </span>
                                )}
                            </div>
                            <div className='flex flex-col gap-1'>
                                {dayItems.map((item) => {
                                    const ts = postDate(item)
                                    return (
                                        <button
                                            key={item.id}
                                            type='button'
                                            draggable={item.status !== 'published'}
                                            onDragStart={() => setDragId(item.id)}
                                            onDragEnd={() => setDragId(null)}
                                            onClick={() => router.push(Routes.DashboardEditor(item.id))}
                                            title={item.title || 'Untitled'}
                                            className={cn(
                                                'flex w-full items-center gap-1 truncate rounded border px-1 py-0.5 text-left text-[10px] leading-tight transition-opacity hover:opacity-80',
                                                STATUS_CHIP[item.status],
                                                item.status !== 'published' && 'cursor-grab active:cursor-grabbing',
                                            )}>
                                            {ts && (
                                                <span className='shrink-0 tabular-nums'>
                                                    {format(new Date(ts), 'HH:mm')}
                                                </span>
                                            )}
                                            <span className='truncate'>{item.title || 'Untitled'}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {isLoading && <p className='text-muted-foreground text-sm'>Loading posts...</p>}
        </div>
    )
}
