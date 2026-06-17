'use client'

import * as React from 'react'
import Link from 'next/link'
import { CalendarClockIcon, CheckIcon, ChevronDownIcon, ExternalLinkIcon, Loader2, SendIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

import { BEST_TIME_SUMMARY, suggestNextSlots } from '@/config/best-time'
import { LINKEDIN_ERROR_CODES } from '@/config/linkedin'
import { ApiRoutes, Routes } from '@/config/routes'
import { type DraftStatus } from '@/lib/drafts'
import { useLinkedInStatus } from '@/hooks/use-linkedin-status'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PublishControlsProps = {
    draftId: string | null
    status: DraftStatus
    scheduledAt: number | null
    linkedinPostUrl: string | null
    hasContent: boolean
    onFlush: () => Promise<void>
    onScheduled: (ts: number | null) => Promise<void>
    onPublished: (url: string) => void
}

const TIMEZONE = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'

function formatDateTime(ms: number): string {
    return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Format a Date as the value a <input type="datetime-local"> expects (local time). */
function toLocalInputValue(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function PublishControls({
    draftId,
    status,
    scheduledAt,
    linkedinPostUrl,
    hasContent,
    onFlush,
    onScheduled,
    onPublished,
}: PublishControlsProps) {
    const { status: liStatus, isLoading: liLoading, canPublish, refresh } = useLinkedInStatus()
    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [scheduleOpen, setScheduleOpen] = React.useState(false)
    const [isPublishing, setIsPublishing] = React.useState(false)
    const [isScheduling, setIsScheduling] = React.useState(false)
    const [dateValue, setDateValue] = React.useState('')

    const suggestions = React.useMemo(() => suggestNextSlots(new Date(), 3), [])

    const handlePublish = React.useCallback(async () => {
        if (!draftId) return
        setIsPublishing(true)
        try {
            await onFlush()
            const res = await fetch(ApiRoutes.LinkedInPublish, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ draftId }),
            })
            const data = await res.json()
            if (!res.ok) {
                if (data.code === LINKEDIN_ERROR_CODES.TOKEN_EXPIRED) {
                    toast.error('LinkedIn connection expired. Reconnect in Settings.')
                    await refresh()
                } else {
                    toast.error(data.error ?? 'Failed to publish')
                }
                return
            }
            onPublished(data.url ?? '')
            toast.success('Published to LinkedIn', {
                action: data.url ? { label: 'View', onClick: () => window.open(data.url, '_blank') } : undefined,
            })
            setConfirmOpen(false)
        } catch {
            toast.error('Failed to publish')
        } finally {
            setIsPublishing(false)
        }
    }, [draftId, onFlush, onPublished, refresh])

    const handleSchedule = React.useCallback(async () => {
        if (!draftId || !dateValue) return
        const ts = new Date(dateValue).getTime()
        if (Number.isNaN(ts) || ts <= Date.now()) {
            toast.error('Pick a time in the future')
            return
        }
        setIsScheduling(true)
        try {
            await onFlush()
            await onScheduled(ts)
            toast.success(`Scheduled for ${formatDateTime(ts)}`)
            setScheduleOpen(false)
        } catch {
            toast.error('Failed to schedule')
        } finally {
            setIsScheduling(false)
        }
    }, [draftId, dateValue, onFlush, onScheduled])

    const handleCancelSchedule = React.useCallback(async () => {
        try {
            await onScheduled(null)
            toast.success('Schedule cancelled')
        } catch {
            toast.error('Failed to cancel schedule')
        }
    }, [onScheduled])

    const openSchedule = React.useCallback(() => {
        const base = scheduledAt ? new Date(scheduledAt) : (suggestNextSlots(new Date(), 1)[0]?.date ?? new Date())
        setDateValue(toLocalInputValue(base))
        setScheduleOpen(true)
    }, [scheduledAt])

    // Already published - show the live link.
    if (status === 'published' && linkedinPostUrl) {
        return (
            <Button asChild variant='outline' size='sm'>
                <a href={linkedinPostUrl} target='_blank' rel='noopener noreferrer'>
                    <ExternalLinkIcon className='size-4' />
                    View on LinkedIn
                </a>
            </Button>
        )
    }

    // Integration not configured on the server - keep the editor uncluttered.
    if (!liLoading && liStatus && !liStatus.configured) {
        return null
    }

    // Configured but not connected - point the user to Settings.
    if (!liLoading && !canPublish) {
        return (
            <Button asChild variant='outline' size='sm'>
                <Link href={Routes.DashboardSettings}>
                    <SendIcon className='size-4' />
                    Connect LinkedIn
                </Link>
            </Button>
        )
    }

    return (
        <>
            {status === 'scheduled' && scheduledAt ? (
                <div className='flex items-center gap-1'>
                    <Button variant='outline' size='sm' onClick={openSchedule}>
                        <CalendarClockIcon className='size-4' />
                        {formatDateTime(scheduledAt)}
                    </Button>
                    <Button
                        variant='ghost'
                        size='icon'
                        className='size-8'
                        aria-label='Cancel schedule'
                        onClick={handleCancelSchedule}>
                        <XIcon className='size-4' />
                    </Button>
                </div>
            ) : (
                <div className='flex items-center'>
                    <Button
                        size='sm'
                        className='rounded-r-none'
                        disabled={!hasContent || isPublishing || liLoading}
                        onClick={() => setConfirmOpen(true)}>
                        {isPublishing ? <Loader2 className='size-4 animate-spin' /> : <SendIcon className='size-4' />}
                        Publish
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size='sm'
                                className='rounded-l-none border-l px-2'
                                disabled={!hasContent || liLoading}>
                                <ChevronDownIcon className='size-4' />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                            <DropdownMenuItem onClick={openSchedule}>
                                <CalendarClockIcon className='size-4' />
                                Schedule for later
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            {/* Publish confirmation */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent size='sm'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Publish to LinkedIn now?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This posts to your LinkedIn profile immediately as{' '}
                            {liStatus?.connection?.name ?? 'your account'}. This cannot be undone from here.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPublishing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handlePublish()
                            }}
                            disabled={isPublishing}>
                            {isPublishing && <Loader2 className='mr-2 size-4 animate-spin' />}
                            Publish now
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Schedule dialog */}
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule post</DialogTitle>
                        <DialogDescription>{BEST_TIME_SUMMARY}</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='schedule-datetime'>Date and time ({TIMEZONE})</Label>
                            <Input
                                id='schedule-datetime'
                                type='datetime-local'
                                value={dateValue}
                                min={toLocalInputValue(new Date())}
                                onChange={(e) => setDateValue(e.target.value)}
                            />
                        </div>
                        <div className='space-y-2'>
                            <p className='text-muted-foreground text-xs font-medium'>Suggested times</p>
                            <div className='flex flex-wrap gap-2'>
                                {suggestions.map((s) => (
                                    <Button
                                        key={s.date.getTime()}
                                        type='button'
                                        variant='outline'
                                        size='sm'
                                        className='text-xs'
                                        onClick={() => setDateValue(toLocalInputValue(s.date))}>
                                        {s.tier === 'best' && <CheckIcon className='size-3 text-green-600' />}
                                        {s.date.toLocaleString(undefined, {
                                            weekday: 'short',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setScheduleOpen(false)} disabled={isScheduling}>
                            Cancel
                        </Button>
                        <Button onClick={handleSchedule} disabled={isScheduling || !dateValue}>
                            {isScheduling && <Loader2 className='mr-2 size-4 animate-spin' />}
                            {scheduledAt ? 'Reschedule' : 'Schedule'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
