'use client'

import * as React from 'react'
import { LinkedinIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { ApiRoutes } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/dashboard/auth-provider'

type ImportLinkedInButtonProps = {
    variant?: React.ComponentProps<typeof Button>['variant']
    size?: React.ComponentProps<typeof Button>['size']
    className?: string
}

type Availability = { configured: boolean; connected: boolean; available: boolean }

/**
 * Drives the LinkedIn API analytics flow. Self-hides unless the analytics app
 * (App B / Community Management API) is configured. When configured but the
 * member hasn't authorized App B yet, it offers a Connect action; once connected
 * it imports their existing posts. Members without API access never see it.
 */
export function ImportLinkedInButton({ variant = 'default', size = 'sm', className }: ImportLinkedInButtonProps) {
    const { userId } = useAuth()
    const [state, setState] = React.useState<Availability>({ configured: false, connected: false, available: false })
    const [importing, setImporting] = React.useState(false)

    React.useEffect(() => {
        if (!userId) return
        let cancelled = false
        fetch(ApiRoutes.AnalyticsImportLinkedIn)
            .then((res) => (res.ok ? res.json() : null))
            .then((data: Partial<Availability> | null) => {
                if (cancelled || !data) return
                setState({
                    configured: Boolean(data.configured),
                    connected: Boolean(data.connected),
                    available: Boolean(data.available),
                })
            })
            .catch(() => {})
        return () => {
            cancelled = true
        }
    }, [userId])

    // Surface the outcome of the App B OAuth redirect (?analytics=...), then clean it.
    React.useEffect(() => {
        if (typeof window === 'undefined') return
        const params = new URLSearchParams(window.location.search)
        const status = params.get('analytics')
        if (!status) return
        if (status === 'connected') toast.success('LinkedIn analytics connected. You can now import your posts.')
        else if (status === 'denied') toast.error('Analytics connection was cancelled')
        else if (status === 'unavailable') toast.error('LinkedIn analytics is not configured')
        else if (status !== 'connected') toast.error('Could not connect LinkedIn analytics')
        params.delete('analytics')
        const qs = params.toString()
        window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
    }, [])

    const connect = React.useCallback(() => {
        window.location.href = ApiRoutes.LinkedInAnalyticsAuth
    }, [])

    const runImport = React.useCallback(async () => {
        setImporting(true)
        try {
            const res = await fetch(ApiRoutes.AnalyticsImportLinkedIn, { method: 'POST' })
            const data = (await res.json().catch(() => ({}))) as {
                success?: boolean
                imported?: number
                error?: string
            }
            if (!res.ok || !data.success) {
                toast.error(data.error ?? 'Failed to import from LinkedIn')
                return
            }
            const imported = data.imported ?? 0
            toast.success(
                imported > 0
                    ? `Imported ${imported} post${imported === 1 ? '' : 's'} from LinkedIn`
                    : 'Your LinkedIn posts are already up to date',
            )
            window.location.reload()
        } catch {
            toast.error('Failed to import from LinkedIn')
        } finally {
            setImporting(false)
        }
    }, [])

    if (!state.configured) return null

    if (!state.connected) {
        return (
            <Button variant={variant} size={size} className={className} onClick={connect}>
                <LinkedinIcon className='size-4' />
                Connect for analytics
            </Button>
        )
    }

    return (
        <Button variant={variant} size={size} className={className} onClick={runImport} disabled={importing}>
            {importing ? <Loader2Icon className='size-4 animate-spin' /> : <LinkedinIcon className='size-4' />}
            {importing ? 'Importing…' : 'Sync from LinkedIn'}
        </Button>
    )
}
