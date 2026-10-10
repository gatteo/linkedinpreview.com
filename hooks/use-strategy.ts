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
    const [readState, setReadState] = React.useState<{
        userId: string
        supabase: typeof supabase
        loadFailed: boolean
    } | null>(null)
    const currentRead = isReady && readState?.userId === userId && readState?.supabase === supabase
    const loading = isLoading || !currentRead
    const loadFailed = !!currentRead && !!readState?.loadFailed

    React.useEffect(() => {
        if (!isReady || !userId) {
            setReadState(null)
            return
        }

        let cancelled = false
        setIsLoading(true)
        setReadState(null)
        setStrategy(DEFAULT_STRATEGY)
        fetchStrategy(supabase)
            .then((data) => {
                if (!cancelled) {
                    setStrategy(data)
                    setReadState({ userId, supabase, loadFailed: false })
                    setIsLoading(false)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    toast.error('Failed to load strategy')
                    setReadState({ userId, supabase, loadFailed: true })
                    setIsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [isReady, userId, supabase])

    const updateStrategy = React.useCallback(
        (updates: Partial<StrategyData>) => {
            if (loading || loadFailed || !userId) {
                toast.error('Failed to load strategy')
                return false
            }
            setStrategy((current) => {
                const updated = { ...current, ...updates }
                if (userId) {
                    upsertStrategy(supabase, userId, updated).catch(() => {
                        toast.error('Failed to save strategy')
                    })
                }
                return updated
            })
            return true
        },
        [supabase, userId, loading, loadFailed],
    )

    return { strategy: currentRead ? strategy : DEFAULT_STRATEGY, isLoading: loading, loadFailed, updateStrategy }
}
