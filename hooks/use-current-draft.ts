'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { decodeDraft } from '@/lib/draft-url'
import { fetchDraft } from '@/lib/supabase/drafts'
import { useDrafts } from '@/hooks/use-drafts'
import { useAuth } from '@/components/dashboard/auth-provider'

const SAVE_DELAY_MS = 2000

interface CurrentDraftState {
    draftId: string | null
    initialContent: any
    initialMedia: { type: 'image' | 'video'; src: string } | null
    isLoading: boolean
}

/**
 * Hook for the dashboard editor. Handles:
 * - Loading the correct draft from the URL `?draft=` param
 * - Falling back to most-recent draft or creating a blank one
 * - Auto-saving content with 2s debounce
 * - Saving media immediately (no debounce)
 * - Keeping the URL in sync with the active draft
 *
 * Must be used inside a `<Suspense>` boundary because it calls `useSearchParams()`.
 */
export function useCurrentDraft() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const draftIdParam = searchParams.get('draft')
    const importParam = searchParams.get('import')
    const { isReady, supabase } = useAuth()
    const { drafts, isLoading, createDraft: createDraftHook, updateDraft: updateDraftHook } = useDrafts()

    const [state, setState] = React.useState<CurrentDraftState>({
        draftId: null,
        initialContent: undefined,
        initialMedia: null,
        isLoading: true,
    })

    const saveTimerRef = React.useRef<ReturnType<typeof setTimeout>>(null)
    const loadedRef = React.useRef(false)
    const loadCallRef = React.useRef(0)

    // Load draft when auth is ready and URL params change
    React.useEffect(() => {
        if (!isReady) return
        // Prevent double-loading when nothing relevant has changed
        if (loadedRef.current && !draftIdParam && !importParam) return
        // Wait for drafts to finish loading before running the "no params" branch
        if (!draftIdParam && !importParam && isLoading) return

        const callId = ++loadCallRef.current

        async function load() {
            // Handle ?import= param (content carried from homepage editor)
            if (importParam) {
                const decoded = await decodeDraft(importParam)
                if (callId !== loadCallRef.current) return
                try {
                    const draft = await createDraftHook(decoded ?? undefined)
                    if (callId !== loadCallRef.current) return
                    router.replace(`/dashboard/editor?draft=${draft.id}`)
                    setState({
                        draftId: draft.id,
                        initialContent: decoded,
                        initialMedia: null,
                        isLoading: false,
                    })
                } catch {
                    if (callId !== loadCallRef.current) return
                    toast.error('Failed to create draft')
                    router.replace('/dashboard')
                    setState({ draftId: null, initialContent: null, initialMedia: null, isLoading: false })
                }
                loadedRef.current = true
                return
            }

            if (draftIdParam) {
                // Fetch the specific draft from Supabase
                try {
                    const result = await fetchDraft(supabase, draftIdParam)
                    if (callId !== loadCallRef.current) return
                    if (result) {
                        setState({
                            draftId: draftIdParam,
                            initialContent: result.content.content,
                            initialMedia: result.content.media,
                            isLoading: false,
                        })
                    } else {
                        // Draft not found - create a new one
                        const draft = await createDraftHook()
                        if (callId !== loadCallRef.current) return
                        router.replace(`/dashboard/editor?draft=${draft.id}`)
                        setState({
                            draftId: draft.id,
                            initialContent: null,
                            initialMedia: null,
                            isLoading: false,
                        })
                    }
                } catch {
                    if (callId !== loadCallRef.current) return
                    toast.error('Failed to load draft')
                    setState({ draftId: draftIdParam, initialContent: null, initialMedia: null, isLoading: false })
                }
                loadedRef.current = true
                return
            }

            // No params - load most recent draft or create one
            if (drafts.length > 0) {
                const mostRecent = [...drafts].sort((a, b) => b.updatedAt - a.updatedAt)[0]
                router.replace(`/dashboard/editor?draft=${mostRecent.id}`)
                try {
                    const result = await fetchDraft(supabase, mostRecent.id)
                    if (callId !== loadCallRef.current) return
                    setState({
                        draftId: mostRecent.id,
                        initialContent: result?.content.content ?? null,
                        initialMedia: result?.content.media ?? null,
                        isLoading: false,
                    })
                } catch {
                    if (callId !== loadCallRef.current) return
                    toast.error('Failed to load draft')
                    setState({
                        draftId: mostRecent.id,
                        initialContent: null,
                        initialMedia: null,
                        isLoading: false,
                    })
                }
            } else {
                try {
                    const draft = await createDraftHook()
                    if (callId !== loadCallRef.current) return
                    router.replace(`/dashboard/editor?draft=${draft.id}`)
                    setState({ draftId: draft.id, initialContent: null, initialMedia: null, isLoading: false })
                } catch {
                    if (callId !== loadCallRef.current) return
                    toast.error('Failed to create draft')
                    setState({ draftId: null, initialContent: null, initialMedia: null, isLoading: false })
                }
            }
            loadedRef.current = true
        }

        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, isLoading, draftIdParam, importParam])

    // Clear save timer on unmount
    React.useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        }
    }, [])

    /**
     * Save content with 2s debounce. Call on every editor change event.
     */
    const saveContent = React.useCallback(
        (content: any) => {
            if (!state.draftId) return
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => {
                updateDraftHook(state.draftId!, { content })
            }, SAVE_DELAY_MS)
        },
        [state.draftId, updateDraftHook],
    )

    /**
     * Save media immediately (no debounce - media changes are infrequent).
     */
    const saveMedia = React.useCallback(
        (media: { type: 'image' | 'video'; src: string } | null) => {
            if (!state.draftId) return
            updateDraftHook(state.draftId, { media })
        },
        [state.draftId, updateDraftHook],
    )

    return {
        draftId: state.draftId,
        initialContent: state.initialContent,
        initialMedia: state.initialMedia,
        isLoading: state.isLoading,
        saveContent,
        saveMedia,
    }
}
