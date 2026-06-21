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

/**
 * Triggers the LinkedIn API import of the member's existing posts. Renders only
 * when API import is available (integration configured + analytics enabled +
 * account connected); otherwise it self-hides, so members without Community
 * Management API access never see a dead control.
 */
export function ImportLinkedInButton({ variant = 'default', size = 'sm', className }: ImportLinkedInButtonProps) {
    const { userId } = useAuth()
    const [available, setAvailable] = React.useState(false)
    const [importing, setImporting] = React.useState(false)

    React.useEffect(() => {
        if (!userId) return
        let cancelled = false
        fetch(ApiRoutes.AnalyticsImportLinkedIn)
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { available?: boolean } | null) => {
                if (!cancelled) setAvailable(Boolean(data?.available))
            })
            .catch(() => {})
        return () => {
            cancelled = true
        }
    }, [userId])

    const runImport = React.useCallback(async () => {
        setImporting(true)
        try {
            const res = await fetch(ApiRoutes.AnalyticsImportLinkedIn, { method: 'POST' })
            const data = (await res.json().catch(() => ({}))) as {
                success?: boolean
                imported?: number
                existing?: number
                metricsSynced?: number
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
            // Reload so the freshly imported posts + metrics populate the dashboard.
            window.location.reload()
        } catch {
            toast.error('Failed to import from LinkedIn')
        } finally {
            setImporting(false)
        }
    }, [])

    if (!available) return null

    return (
        <Button variant={variant} size={size} className={className} onClick={runImport} disabled={importing}>
            {importing ? <Loader2Icon className='size-4 animate-spin' /> : <LinkedinIcon className='size-4' />}
            {importing ? 'Importing…' : 'Sync from LinkedIn'}
        </Button>
    )
}
