'use client'

import * as React from 'react'
import Image from 'next/image'
import { CheckCircle2Icon, Linkedin, Loader2, TriangleAlertIcon } from 'lucide-react'
import { toast } from 'sonner'

import { ApiRoutes, Routes } from '@/config/routes'
import { useDrafts } from '@/hooks/use-drafts'
import { useLinkedInStatus } from '@/hooks/use-linkedin-status'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

const STATUS_MESSAGES: Record<string, { type: 'success' | 'error'; message: string }> = {
    'connected': { type: 'success', message: 'LinkedIn account connected' },
    'denied': { type: 'error', message: 'LinkedIn connection was cancelled' },
    'error': { type: 'error', message: 'Could not connect LinkedIn. Please try again.' },
    'session': { type: 'error', message: 'Session not ready. Reload and try again.' },
    'unavailable': { type: 'error', message: 'LinkedIn publishing is not configured on this server.' },
    'welcome': { type: 'success', message: 'Welcome back - signed in with LinkedIn' },
    'linked-elsewhere': {
        type: 'error',
        message: 'This LinkedIn is linked to another account. Disconnect it there first.',
    },
    'signin-failed': { type: 'error', message: 'Could not sign you in with LinkedIn. Please try again.' },
}

const EMAIL_MESSAGES: Record<string, { type: 'success' | 'error'; message: string }> = {
    confirmed: { type: 'success', message: 'Email confirmed - your account is now saved' },
    error: { type: 'error', message: 'Could not confirm your email. Please try again.' },
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function LinkedInConnection() {
    const { status, isLoading, refresh } = useLinkedInStatus()
    const [isDisconnecting, setIsDisconnecting] = React.useState(false)
    const [mergeOpen, setMergeOpen] = React.useState(false)

    // Surface the callback result (?linkedin=...) as a toast (or the merge prompt),
    // then clean the URL.
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const result = params.get('linkedin')
        const emailResult = params.get('email')
        if (!result && !emailResult) return
        if (result === 'merge-prompt') {
            // A LinkedIn login matched an existing account and the current session
            // has drafts - ask whether to carry them over before switching.
            setMergeOpen(true)
        } else {
            const entry = result ? STATUS_MESSAGES[result] : undefined
            if (entry) toast[entry.type](entry.message)
        }
        const emailEntry = emailResult ? EMAIL_MESSAGES[emailResult] : undefined
        if (emailEntry) toast[emailEntry.type](emailEntry.message)
        params.delete('linkedin')
        params.delete('email')
        const qs = params.toString()
        window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
    }, [])

    const handleDisconnect = React.useCallback(async () => {
        setIsDisconnecting(true)
        try {
            const res = await fetch(ApiRoutes.LinkedInDisconnect, { method: 'POST' })
            if (!res.ok) throw new Error()
            toast.success('LinkedIn account disconnected')
            await refresh()
        } catch {
            toast.error('Failed to disconnect')
        } finally {
            setIsDisconnecting(false)
        }
    }, [refresh])

    const connection = status?.connection ?? null

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Linkedin className='size-4 text-[#0a66c2]' />
                        LinkedIn
                    </CardTitle>
                    <CardDescription>
                        Connect your LinkedIn account to publish and schedule posts directly from the editor.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                            <Loader2 className='size-4 animate-spin' />
                            Checking connection...
                        </div>
                    ) : !status?.configured ? (
                        <p className='text-muted-foreground text-sm'>
                            LinkedIn publishing is not configured on this server yet.
                        </p>
                    ) : connection ? (
                        <div className='flex flex-col gap-4'>
                            <div className='flex items-center gap-3'>
                                {connection.pictureUrl ? (
                                    <Image
                                        src={connection.pictureUrl}
                                        alt={connection.name ?? 'LinkedIn avatar'}
                                        width={40}
                                        height={40}
                                        className='size-10 rounded-full'
                                        unoptimized
                                    />
                                ) : (
                                    <div className='bg-muted flex size-10 items-center justify-center rounded-full'>
                                        <Linkedin className='size-5 text-[#0a66c2]' />
                                    </div>
                                )}
                                <div className='min-w-0'>
                                    <p className='truncate text-sm font-medium'>
                                        {connection.name ?? 'LinkedIn account'}
                                    </p>
                                    {connection.expired ? (
                                        <span className='text-destructive flex items-center gap-1 text-xs'>
                                            <TriangleAlertIcon className='size-3' />
                                            Connection expired - reconnect to keep publishing
                                        </span>
                                    ) : connection.expiresSoon ? (
                                        <span className='flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500'>
                                            <TriangleAlertIcon className='size-3' />
                                            Expires {formatDate(connection.expiresAt)} - reconnect soon
                                        </span>
                                    ) : (
                                        <span className='text-muted-foreground flex items-center gap-1 text-xs'>
                                            <CheckCircle2Icon className='size-3 text-green-600' />
                                            Connected - expires {formatDate(connection.expiresAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className='flex gap-2'>
                                {(connection.expired || connection.expiresSoon) && (
                                    <Button asChild size='sm'>
                                        <a href={ApiRoutes.LinkedInAuth}>Reconnect</a>
                                    </Button>
                                )}
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={handleDisconnect}
                                    disabled={isDisconnecting}>
                                    {isDisconnecting && <Loader2 className='mr-2 size-4 animate-spin' />}
                                    Disconnect
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button asChild>
                            <a href={ApiRoutes.LinkedInAuth}>
                                <Linkedin className='size-4' />
                                Connect LinkedIn
                            </a>
                        </Button>
                    )}
                </CardContent>
            </Card>
            <MergePromptDialog open={mergeOpen} onOpenChange={setMergeOpen} />
        </>
    )
}

/**
 * Shown when a LinkedIn login matches an existing account while the current
 * (anonymous) session still has drafts. Offers to carry those drafts into the
 * existing account before signing in.
 */
function MergePromptDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { drafts } = useDrafts()
    const [submitting, setSubmitting] = React.useState<'merge' | 'skip' | null>(null)
    const draftCount = drafts.length

    const signIn = React.useCallback(async (merge: boolean) => {
        setSubmitting(merge ? 'merge' : 'skip')
        try {
            const res = await fetch(ApiRoutes.LinkedInSwitch, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ merge }),
            })
            if (!res.ok) throw new Error()
            // Full reload so AuthProvider picks up the new session cookies.
            window.location.assign(`${Routes.DashboardSettings}?linkedin=welcome`)
        } catch {
            toast.error('Could not sign you in. Please try again.')
            setSubmitting(null)
        }
    }, [])

    return (
        <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Welcome back</DialogTitle>
                    <DialogDescription>
                        This LinkedIn account already has an account here. Sign in to it
                        {draftCount > 0
                            ? ` — and bring ${draftCount === 1 ? 'your current draft' : `your ${draftCount} current drafts`} along?`
                            : '?'}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant='outline' onClick={() => signIn(false)} disabled={submitting !== null}>
                        {submitting === 'skip' && <Loader2 className='mr-2 size-4 animate-spin' />}
                        Just sign in
                    </Button>
                    <Button onClick={() => signIn(true)} disabled={submitting !== null}>
                        {submitting === 'merge' && <Loader2 className='mr-2 size-4 animate-spin' />}
                        Bring my drafts
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
