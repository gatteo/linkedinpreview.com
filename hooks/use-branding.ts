'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { DEFAULT_BRANDING, type BrandingData } from '@/lib/branding'
import { fetchBranding, upsertBranding } from '@/lib/supabase/branding'
import { useAuth } from '@/components/dashboard/auth-provider'

export function useBranding() {
    const { isReady, userId, supabase } = useAuth()
    const [branding, setBranding] = React.useState<BrandingData>(DEFAULT_BRANDING)
    const [isLoading, setIsLoading] = React.useState(true)
    const [readState, setReadState] = React.useState<{
        userId: string
        supabase: typeof supabase
        loadFailed: boolean
    } | null>(null)
    const currentRead = isReady && readState?.userId === userId && readState?.supabase === supabase
    const loading = isLoading || !currentRead
    const loadFailed = !!currentRead && !!readState?.loadFailed

    // Fetch on mount when auth is ready
    React.useEffect(() => {
        if (!isReady || !userId) {
            setReadState(null)
            return
        }

        let cancelled = false
        setIsLoading(true)
        setReadState(null)
        setBranding(DEFAULT_BRANDING)
        fetchBranding(supabase)
            .then((data) => {
                if (!cancelled) {
                    setBranding(data)
                    setReadState({ userId, supabase, loadFailed: false })
                    setIsLoading(false)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    toast.error('Failed to load branding settings')
                    setReadState({ userId, supabase, loadFailed: true })
                    setIsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [isReady, userId, supabase])

    const updateBranding = React.useCallback(
        (updates: Partial<BrandingData>) => {
            if (loading || loadFailed || !userId) {
                toast.error('Failed to load branding settings')
                return false
            }
            setBranding((current) => {
                const updated = { ...current, ...updates }
                // Persist to Supabase in background
                if (userId) {
                    upsertBranding(supabase, userId, updated).catch(() => {
                        toast.error('Failed to save branding')
                    })
                }
                return updated
            })
            return true
        },
        [supabase, userId, loading, loadFailed],
    )

    return { branding: currentRead ? branding : DEFAULT_BRANDING, isLoading: loading, loadFailed, updateBranding }
}
