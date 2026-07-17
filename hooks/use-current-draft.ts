'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { decodeDraft } from '@/lib/draft-url'
import { type DraftStatus } from '@/lib/drafts'
import { hasTextContent } from '@/lib/editor-utils'
import {
    deleteDraft as deleteDraftApi,
    fetchDraft,
    setDraftSchedule,
    updateDraft as updateDraftApi,
} from '@/lib/supabase/drafts'
import { useDrafts } from '@/hooks/use-drafts'
import { useAuth } from '@/components/dashboard/auth-provider'

const SAVE_DELAY_MS = 2000

interface CurrentDraftState {
    draftId: string | null
    initialContent: any
    initialMedia: { type: 'image' | 'video'; src: string } | null
    label: string | null
    status: DraftStatus
    scheduledAt: number | null
    linkedinPostUrl: string | null
    isLoading: boolean
}

const EMPTY: CurrentDraftState = {
    draftId: null,
    initialContent: undefined,
    initialMedia: null,
    label: null,
    status: 'draft',
    scheduledAt: null,
    linkedinPostUrl: null,
    isLoading: true,
}

/**
 * Hook for the dashboard editor. Handles:
 * - Loading the correct draft from the URL `?draft=` param
 * - Falling back to most-recent draft or creating a blank one
 * - Auto-saving content with 2s debounce
 * - Saving media immediately (no debounce)
 * - Keeping the URL in sync with the active draft
 * - Publishing/scheduling state for the LinkedIn integration
 *
 * Must be used inside a `<Suspense>` boundary because it calls `useSearchParams()`.
 */
export function useCurrentDraft() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const draftIdParam = searchParams.get('draft')
    const importParam = searchParams.get('import')
    const { isReady, supabase } = useAuth()
    const {
        drafts,
        isLoading,
        createDraft: createDraftHook,
        updateDraft: updateDraftHook,
        purgeEmptyDrafts,
    } = useDrafts()

    const [state, setState] = React.useState<CurrentDraftState>(EMPTY)

    const saveTimerRef = React.useRef<ReturnType<typeof setTimeout>>(null)
    const latestContentRef = React.useRef<any>(undefined)
    // Tracks media set during this session (undefined = untouched since load).
    const latestMediaRef = React.useRef<CurrentDraftState['initialMedia'] | undefined>(undefined)
    // True only when the active draft loaded/created successfully AND was empty,
    // so the unmount cleanup never discards a draft whose load failed (which would
    // destroy real server-side content). Reset at the start of every load.
    const loadedEmptyRef = React.useRef(false)
    const loadedRef = React.useRef(false)
    const loadCallRef = React.useRef(0)
    // Marks when this editor session started, so the empty-draft sweep only
    // touches drafts created earlier and never a blank another tab just created.
    const sessionStartRef = React.useRef<string>(new Date().toISOString())

    // Load draft when auth is ready and URL params change
    React.useEffect(() => {
        if (!isReady) return
        // Prevent double-loading when nothing relevant has changed
        if (loadedRef.current && !draftIdParam && !importParam) return
        // Wait for drafts to finish loading before running the "no params" branch
        if (!draftIdParam && !importParam && isLoading) return

        const callId = ++loadCallRef.current

        async function load() {
            // Switching drafts: persist any unsaved edit for the draft we're
            // leaving (and cancel its pending debounce), then reset the edit refs
            // so cleanup reasons only about the draft we're about to load.
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            if (state.draftId && latestContentRef.current !== undefined) {
                await updateDraftHook(state.draftId, { content: latestContentRef.current })
            }
            latestContentRef.current = undefined
            latestMediaRef.current = undefined
            loadedEmptyRef.current = false

            // Handle ?import= param (content carried from homepage editor)
            if (importParam) {
                const decoded = await decodeDraft(importParam)
                if (callId !== loadCallRef.current) return
                try {
                    const draft = await createDraftHook(decoded ?? undefined)
                    if (callId !== loadCallRef.current) return
                    loadedEmptyRef.current = !hasTextContent(decoded)
                    router.replace(`/dashboard/editor?draft=${draft.id}`)
                    setState({
                        ...EMPTY,
                        draftId: draft.id,
                        initialContent: decoded,
                        label: draft.label,
                        status: draft.status,
                        isLoading: false,
                    })
                } catch {
                    if (callId !== loadCallRef.current) return
                    toast.error('Failed to create draft')
                    router.replace('/dashboard')
                    setState({ ...EMPTY, initialContent: null, isLoading: false })
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
                        loadedEmptyRef.current = !hasTextContent(result.content.content) && !result.content.media
                        setState({
                            ...EMPTY,
                            draftId: draftIdParam,
                            initialContent: result.content.content,
                            initialMedia: result.content.media,
                            label: result.entry.label,
                            status: result.entry.status,
                            scheduledAt: result.entry.scheduledAt,
                            linkedinPostUrl: result.entry.linkedinPostUrl,
                            isLoading: false,
                        })
                    } else {
                        // Draft not found - create a new one
                        const draft = await createDraftHook()
                        if (callId !== loadCallRef.current) return
                        loadedEmptyRef.current = true
                        router.replace(`/dashboard/editor?draft=${draft.id}`)
                        setState({
                            ...EMPTY,
                            draftId: draft.id,
                            initialContent: null,
                            label: draft.label,
                            status: draft.status,
                            isLoading: false,
                        })
                    }
                } catch {
                    if (callId !== loadCallRef.current) return
                    toast.error('Failed to load draft')
                    setState({ ...EMPTY, draftId: draftIdParam, initialContent: null, isLoading: false })
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
                    loadedEmptyRef.current = !hasTextContent(result?.content.content) && !result?.content.media
                    setState({
                        ...EMPTY,
                        draftId: mostRecent.id,
                        initialContent: result?.content.content ?? null,
                        initialMedia: result?.content.media ?? null,
                        label: result?.entry.label ?? null,
                        status: result?.entry.status ?? 'draft',
                        scheduledAt: result?.entry.scheduledAt ?? null,
                        linkedinPostUrl: result?.entry.linkedinPostUrl ?? null,
                        isLoading: false,
                    })
                } catch {
                    if (callId !== loadCallRef.current) return
                    toast.error('Failed to load draft')
                    setState({ ...EMPTY, draftId: mostRecent.id, initialContent: null, isLoading: false })
                }
            } else {
                try {
                    const draft = await createDraftHook()
                    if (callId !== loadCallRef.current) return
                    loadedEmptyRef.current = true
                    router.replace(`/dashboard/editor?draft=${draft.id}`)
                    setState({
                        ...EMPTY,
                        draftId: draft.id,
                        initialContent: null,
                        label: draft.label,
                        status: draft.status,
                        isLoading: false,
                    })
                } catch {
                    if (callId !== loadCallRef.current) return
                    toast.error('Failed to create draft')
                    setState({ ...EMPTY, initialContent: null, isLoading: false })
                }
            }
            loadedRef.current = true
        }

        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, isLoading, draftIdParam, importParam])

    // Once the editor settles on a draft, sweep away empty drafts left behind by
    // the eager-create-on-open flow. Scoped to drafts created before this session
    // (never a blank another tab just made) and skips the one currently open. Goes
    // through useDrafts so the in-memory list stays in sync with the deletes.
    React.useEffect(() => {
        if (!isReady || !state.draftId) return
        purgeEmptyDrafts({ exceptId: state.draftId, createdBefore: sessionStartRef.current })
    }, [isReady, state.draftId, purgeEmptyDrafts])

    // On unmount, discard the active draft if it loaded empty and the user never
    // typed anything or added media, so blank drafts don't accumulate. Otherwise
    // flush any pending edit so the last keystrokes aren't lost when the debounce
    // is dropped. `loadedEmptyRef` gates the delete to drafts we positively know
    // were empty, so a load failure never destroys real server-side content.
    // Kept current via an effect (no render-phase side effects) so the unmount
    // cleanup reads the latest state/refs.
    const cleanupRef = React.useRef<() => void>(undefined)
    React.useEffect(() => {
        cleanupRef.current = () => {
            const id = state.draftId
            if (!id) return
            const typed = latestContentRef.current
            const typedText = typed !== undefined && hasTextContent(typed)
            const addedMedia = latestMediaRef.current !== undefined && !!latestMediaRef.current
            if (loadedEmptyRef.current && !typedText && !addedMedia) {
                void deleteDraftApi(supabase, id).catch(() => {})
            } else if (typed !== undefined) {
                void updateDraftApi(supabase, id, { content: typed }).catch(() => {})
            }
        }
    })

    React.useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            cleanupRef.current?.()
        }
    }, [])

    /**
     * Save content with 2s debounce. Call on every editor change event.
     */
    const saveContent = React.useCallback(
        (content: any) => {
            if (!state.draftId) return
            latestContentRef.current = content
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => {
                updateDraftHook(state.draftId!, { content })
            }, SAVE_DELAY_MS)
        },
        [state.draftId, updateDraftHook],
    )

    /**
     * Immediately persist the latest pending content edit. Call before publishing
     * or scheduling so the server reads the on-screen text, not a stale debounce.
     */
    const flush = React.useCallback(async () => {
        if (!state.draftId) return
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        if (latestContentRef.current !== undefined) {
            await updateDraftHook(state.draftId, { content: latestContentRef.current })
        }
    }, [state.draftId, updateDraftHook])

    /**
     * Save media immediately (no debounce - media changes are infrequent).
     */
    const saveMedia = React.useCallback(
        (media: { type: 'image' | 'video'; src: string } | null) => {
            if (!state.draftId) return
            latestMediaRef.current = media
            updateDraftHook(state.draftId, { media })
        },
        [state.draftId, updateDraftHook],
    )

    /**
     * Save the format label immediately (no debounce - label changes are infrequent).
     */
    const saveLabel = React.useCallback(
        (label: string | null) => {
            if (!state.draftId) return
            setState((prev) => ({ ...prev, label }))
            updateDraftHook(state.draftId, { label })
        },
        [state.draftId, updateDraftHook],
    )

    /**
     * Save the post status immediately. This is a manual label only and does not
     * publish to LinkedIn; the publish/schedule actions handle real delivery.
     */
    const saveStatus = React.useCallback(
        (status: DraftStatus) => {
            if (!state.draftId) return
            setState((prev) => ({ ...prev, status }))
            updateDraftHook(state.draftId, { status })
        },
        [state.draftId, updateDraftHook],
    )

    /**
     * Schedule (or unschedule when `scheduledAtMs` is null) the current draft.
     */
    const saveSchedule = React.useCallback(
        async (scheduledAtMs: number | null) => {
            if (!state.draftId) return
            await setDraftSchedule(supabase, state.draftId, scheduledAtMs)
            setState((prev) => ({
                ...prev,
                status: scheduledAtMs === null ? 'draft' : 'scheduled',
                scheduledAt: scheduledAtMs,
            }))
        },
        [state.draftId, supabase],
    )

    /** Reflect a successful publish in local state. */
    const applyPublished = React.useCallback((url: string) => {
        setState((prev) => ({ ...prev, status: 'published', scheduledAt: null, linkedinPostUrl: url }))
    }, [])

    return {
        draftId: state.draftId,
        initialContent: state.initialContent,
        initialMedia: state.initialMedia,
        label: state.label,
        status: state.status,
        scheduledAt: state.scheduledAt,
        linkedinPostUrl: state.linkedinPostUrl,
        isLoading: state.isLoading,
        saveContent,
        saveMedia,
        saveLabel,
        saveStatus,
        flush,
        saveSchedule,
        applyPublished,
    }
}
