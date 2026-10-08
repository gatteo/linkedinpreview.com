'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { DEFAULT_STRATEGY, type StrategyData } from '@/lib/strategy'
import { fetchStrategy, upsertStrategy } from '@/lib/supabase/strategy'
import { useAuth } from '@/components/dashboard/auth-provider'

export function useStrategy() {
    const { isReady, userId, supabase } = useAuth()
    const [strategy, setStrategy] = React.useState<StrategyData>(DEFAULT_STRATEGY)
    const [isLoading, setIsLoading] = React.useState(true)
    // Same reason as useBranding: DEFAULT_STRATEGY after a failed read reads as
    // "never completed onboarding" to the gate that decides whether to re-run it.
    const [loadFailed, setLoadFailed] = React.useState(false)

    React.useEffect(() => {
        if (!isReady || !userId) return

        let cancelled = false
        setIsLoading(true)
        fetchStrategy(supabase)
            .then((data) => {
                if (!cancelled) {
                    setStrategy(data)
                    setLoadFailed(false)
                    setIsLoading(false)
                }
            })
            .catch(() => {
                toast.error('Failed to load strategy')
                if (!cancelled) {
                    setLoadFailed(true)
                    setIsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [isReady, userId, supabase])

    const updateStrategy = React.useCallback(
        (updates: Partial<StrategyData>) => {
            setStrategy((current) => {
                const updated = { ...current, ...updates }
                if (userId) {
                    upsertStrategy(supabase, userId, updated).catch(() => {
                        toast.error('Failed to save strategy')
                    })
                }
                return updated
            })
        },
        [supabase, userId],
    )

    return { strategy, isLoading, loadFailed, updateStrategy }
}
