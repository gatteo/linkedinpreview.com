'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { type DraftManifestEntry, type DraftStatus } from '@/lib/drafts'
import {
    createDraft as createDraftApi,
    deleteDraft as deleteDraftApi,
    duplicateDraft as duplicateDraftApi,
    fetchDrafts,
    updateDraft as updateDraftApi,
} from '@/lib/supabase/drafts'
import { useAuth } from '@/components/dashboard/auth-provider'

export function useDrafts() {
    const { isReady, userId, supabase } = useAuth()
    const [drafts, setDrafts] = React.useState<DraftManifestEntry[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    // Fetch drafts when auth is ready
    React.useEffect(() => {
        if (!isReady || !userId) return

        let cancelled = false
        setIsLoading(true)

        fetchDrafts(supabase)
            .then((data) => {
                if (!cancelled) {
                    setDrafts(data)
                    setIsLoading(false)
                }
            })
            .catch(() => {
                toast.error('Failed to load drafts')
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [isReady, userId, supabase])

    const createDraft = React.useCallback(
        async (initialContent?: any): Promise<DraftManifestEntry> => {
            if (!userId) throw new Error('Not authenticated')
            const entry = await createDraftApi(supabase, userId, initialContent)
            setDrafts((prev) => [entry, ...prev])
            return entry
        },
        [supabase, userId],
    )

    const deleteDraft = React.useCallback(
        async (id: string) => {
            // Optimistic update
            setDrafts((prev) => prev.filter((d) => d.id !== id))
            try {
                await deleteDraftApi(supabase, id)
            } catch {
                toast.error('Failed to delete draft')
                // Refetch to restore correct state
                fetchDrafts(supabase)
                    .then(setDrafts)
                    .catch(() => {})
            }
        },
        [supabase],
    )

    const duplicateDraft = React.useCallback(
        async (id: string): Promise<DraftManifestEntry | null> => {
            if (!userId) return null
            try {
                const entry = await duplicateDraftApi(supabase, userId, id)
                if (entry) {
                    setDrafts((prev) => [entry, ...prev])
                }
                return entry
            } catch {
                toast.error('Failed to duplicate draft')
                return null
            }
        },
        [supabase, userId],
    )

    const updateDraft = React.useCallback(
        async (id: string, updates: { content?: any; media?: any; status?: DraftStatus; label?: string | null }) => {
            // Optimistic update for local state
            if (updates.content !== undefined || updates.status !== undefined || updates.label !== undefined) {
                setDrafts((prev) =>
                    prev.map((d) => {
                        if (d.id !== id) return d
                        const updated = { ...d, updatedAt: Date.now() }
                        if (updates.status !== undefined) updated.status = updates.status
                        if (updates.label !== undefined) updated.label = updates.label
                        return updated
                    }),
                )
            }
            try {
                await updateDraftApi(supabase, id, updates)
            } catch {
                toast.error('Failed to save draft')
            }
        },
        [supabase],
    )

    const recentDrafts = React.useMemo(
        () => [...drafts].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3),
        [drafts],
    )

    return {
        drafts,
        recentDrafts,
        isLoading,
        createDraft,
        deleteDraft,
        duplicateDraft,
        updateDraft,
    }
}
