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
    // A failed read leaves `branding` on DEFAULT_BRANDING, which is indistinguishable
    // from a genuinely empty profile. Callers that decide something on absence (the
    // onboarding gate reads meta.onboardedAt) must be able to tell the two apart.
    const [loadFailed, setLoadFailed] = React.useState(false)

    // Fetch on mount when auth is ready
    React.useEffect(() => {
        if (!isReady || !userId) return

        let cancelled = false
        setIsLoading(true)
        fetchBranding(supabase)
            .then((data) => {
                if (!cancelled) {
                    setBranding(data)
                    setLoadFailed(false)
                    setIsLoading(false)
                }
            })
            .catch(() => {
                toast.error('Failed to load branding settings')
                if (!cancelled) {
                    setLoadFailed(true)
                    setIsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [isReady, userId, supabase])

    const updateBranding = React.useCallback(
        (updates: Partial<BrandingData>) => {
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
        },
        [supabase, userId],
    )

    return { branding, isLoading, loadFailed, updateBranding }
}
