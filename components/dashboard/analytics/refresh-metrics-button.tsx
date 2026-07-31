'use client'

import * as React from 'react'
import { LinkedinIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react'
import posthog from 'posthog-js'
import { toast } from 'sonner'

import { ApiRoutes } from '@/config/routes'
import { reportMissingEnv, reportMissingEnvFromQuery } from '@/lib/dev/report-missing-env'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/dashboard/auth-provider'

type RefreshMetricsButtonProps = {
    variant?: React.ComponentProps<typeof Button>['variant']
    size?: React.ComponentProps<typeof Button>['size']
    className?: string
}

type Availability = { configured: boolean; connected: boolean }

/**
 * Drives the App B (Community Management API) analytics connection. Self-hides
 * unless the analytics app is configured. Offers "Connect for analytics" until
 * the member authorizes App B, then a "Refresh metrics" action that pulls fresh
 * numbers for the posts published through this app (the same data the daily
 * cron syncs, on demand). Members without API access never see it.
 */
export function RefreshMetricsButton({ variant = 'default', size = 'sm', className }: RefreshMetricsButtonProps) {
    const { userId } = useAuth()
    const [state, setState] = React.useState<Availability>({ configured: false, connected: false })
    const [refreshing, setRefreshing] = React.useState(false)

    React.useEffect(() => {
        if (!userId) return
        let cancelled = false
        fetch(ApiRoutes.AnalyticsRefreshMetrics)
            .then((res) => (res.ok ? res.json() : null))
            .then((data: Partial<Availability> | null) => {
                if (cancelled || !data) return
                setState({ configured: Boolean(data.configured), connected: Boolean(data.connected) })
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
        if (status === 'connected') toast.success('LinkedIn analytics connected')
        else if (status === 'denied') toast.error('Analytics connection was cancelled')
        else if (status === 'unavailable') {
            if (!reportMissingEnvFromQuery('LinkedIn analytics', params))
                toast.error('LinkedIn analytics is not configured')
        } else if (status !== 'connected') toast.error('Could not connect LinkedIn analytics')
        params.delete('analytics')
        const qs = params.toString()
        window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
    }, [])

    const connect = React.useCallback(() => {
        posthog?.capture('linkedin_analytics_connect_clicked')
        window.location.href = ApiRoutes.LinkedInAnalyticsAuth
    }, [])

    const refresh = React.useCallback(async () => {
        setRefreshing(true)
        try {
            const res = await fetch(ApiRoutes.AnalyticsRefreshMetrics, { method: 'POST' })
            const data = (await res.json().catch(() => ({}))) as { success?: boolean; synced?: number; error?: string }
            if (!res.ok || !data.success) {
                if (reportMissingEnv('LinkedIn analytics', (data as { missing?: unknown }).missing)) return
                toast.error(data.error ?? 'Failed to refresh metrics')
                return
            }
            posthog?.capture('linkedin_metrics_refreshed', { synced: data.synced ?? 0 })
            const synced = data.synced ?? 0
            toast.success(
                synced > 0
                    ? `Refreshed metrics for ${synced} post${synced === 1 ? '' : 's'}`
                    : 'Your metrics are already up to date',
            )
            window.location.reload()
        } catch {
            toast.error('Failed to refresh metrics')
        } finally {
            setRefreshing(false)
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
        <Button variant={variant} size={size} className={className} onClick={refresh} disabled={refreshing}>
            {refreshing ? <Loader2Icon className='size-4 animate-spin' /> : <RefreshCwIcon className='size-4' />}
            {refreshing ? 'Refreshing…' : 'Refresh metrics'}
        </Button>
    )
}
