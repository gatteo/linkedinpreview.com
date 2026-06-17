'use client'

import * as React from 'react'

import { ApiRoutes } from '@/config/routes'

export interface LinkedInStatus {
    configured: boolean
    connection: {
        connected: true
        name: string | null
        pictureUrl: string | null
        expiresAt: string
        expiresSoon: boolean
        expired: boolean
    } | null
}

/** Fetch the current LinkedIn integration/connection status once. */
export function useLinkedInStatus() {
    const [status, setStatus] = React.useState<LinkedInStatus | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    const refresh = React.useCallback(async () => {
        try {
            const res = await fetch(ApiRoutes.LinkedInStatus)
            setStatus(await res.json())
        } catch {
            setStatus({ configured: false, connection: null })
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        refresh()
    }, [refresh])

    const canPublish = Boolean(status?.configured && status.connection && !status.connection.expired)

    return { status, isLoading, canPublish, refresh }
}
