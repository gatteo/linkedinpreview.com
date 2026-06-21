'use client'

import * as React from 'react'
import { toast } from 'sonner'

import type { MetricSource, MetricValues, PostMetrics } from '@/lib/analytics/metrics'
import {
    deletePostMetrics as deletePostMetricsApi,
    fetchPostMetrics,
    upsertPostMetrics as upsertPostMetricsApi,
} from '@/lib/supabase/post-metrics'
import { useAuth } from '@/components/dashboard/auth-provider'

export function usePostMetrics() {
    const { isReady, userId, supabase } = useAuth()
    const [metrics, setMetrics] = React.useState<Record<string, PostMetrics>>({})
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        if (!isReady || !userId) return

        let cancelled = false
        setIsLoading(true)
        fetchPostMetrics(supabase)
            .then((data) => {
                if (!cancelled) {
                    setMetrics(data)
                    setIsLoading(false)
                }
            })
            .catch(() => {
                toast.error('Failed to load post metrics')
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [isReady, userId, supabase])

    const saveMetrics = React.useCallback(
        async (draftId: string, values: MetricValues, source: MetricSource = 'manual'): Promise<void> => {
            if (!userId) return
            try {
                const saved = await upsertPostMetricsApi(supabase, userId, draftId, values, source)
                setMetrics((prev) => ({ ...prev, [draftId]: saved }))
            } catch {
                toast.error('Failed to save metrics')
            }
        },
        [supabase, userId],
    )

    /** Bulk upsert (used by CSV import). Returns how many rows were saved. */
    const saveManyMetrics = React.useCallback(
        async (rows: { draftId: string; values: MetricValues }[], source: MetricSource): Promise<number> => {
            if (!userId) return 0
            let saved = 0
            const next: Record<string, PostMetrics> = {}
            for (const row of rows) {
                try {
                    next[row.draftId] = await upsertPostMetricsApi(supabase, userId, row.draftId, row.values, source)
                    saved++
                } catch {
                    // Skip the failed row; report the count that did persist.
                }
            }
            if (saved > 0) setMetrics((prev) => ({ ...prev, ...next }))
            return saved
        },
        [supabase, userId],
    )

    const removeMetrics = React.useCallback(
        async (draftId: string): Promise<void> => {
            setMetrics((prev) => {
                const next = { ...prev }
                delete next[draftId]
                return next
            })
            try {
                await deletePostMetricsApi(supabase, draftId)
            } catch {
                toast.error('Failed to remove metrics')
            }
        },
        [supabase],
    )

    return { metrics, isLoading, saveMetrics, saveManyMetrics, removeMetrics }
}
