'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { ENTRY_PARAM } from '@/config/entry-sources'
import { deferPlanning, intentionalDraftImport, readDraftFirst, writeDraftFirst } from '@/lib/draft-first'
import { draftImportFailureProperties, importDraft, type DraftImportDiagnostics } from '@/lib/draft-import'
import { type DraftStatus } from '@/lib/drafts'
import { extractPlainText } from '@/lib/editor-utils'
import {
    deleteDraft as deleteDraftApi,
    fetchDraft,
    setDraftSchedule,
    updateDraft as updateDraftApi,
} from '@/lib/supabase/drafts'
import { useDrafts } from '@/hooks/use-drafts'
import { useAuth } from '@/components/dashboard/auth-provider'
import { setEntrySource, track } from '@/components/dashboard/onboarding/ai'

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

/** Re-attach the arrival's `?from=` to a URL this hook rewrites, so the redirect
 *  that resolves the draft does not destroy attribution the user arrived with. */
function withEntry(href: string, entry: string | null): string {
    const url = new URL(href, window.location.origin)
    const arrival = new URLSearchParams(window.location.search)
    for (const [key, value] of arrival) {
        if (!['import', 'm', 'draft'].includes(key)) url.searchParams.set(key, value)
    }
    if (entry) url.searchParams.set(ENTRY_PARAM, entry)
    return `${url.pathname}${url.search}`
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
    // The entry source the user arrived with. Every redirect below rewrites the
    // URL to the resolved draft, which used to drop `?from=` before
    // OnboardingController read it off window.location - so a tool handoff was
    // attributed `direct` and lost its entry-coherent welcome copy. Carry it.
    const entryParam = searchParams.get(ENTRY_PARAM)
    const { isReady, userId, supabase } = useAuth()
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
    const meaningfulEditRef = React.useRef(false)
    // Tracks media set during this session (undefined = untouched since load).
    const latestMediaRef = React.useRef<CurrentDraftState['initialMedia'] | undefined>(undefined)
    // True only when the active draft loaded/created successfully AND was empty,
    // so the unmount cleanup never discards a draft whose load failed (which would
    // destroy real server-side content). Reset at the start of every load.
    const loadedEmptyRef = React.useRef(false)
    const loadedRef = React.useRef(false)
    const loadCallRef = React.useRef(0)
    const importRef = React.useRef<{
        key: string
        promise: ReturnType<typeof importDraft<import('@/lib/drafts').DraftManifestEntry>>
        diagnostics: DraftImportDiagnostics
    } | null>(null)
    // Marks when this editor session started, so the empty-draft sweep only
    // touches drafts created earlier and never a blank another tab just created.
    const sessionStartRef = React.useRef<string>(new Date().toISOString())

    const recordSavedEdit = React.useCallback(
        (id: string, saved: boolean, meaningful: boolean) => {
            const choice = readDraftFirst(userId)
            if (!userId || choice?.draftId !== id || choice.used || !meaningful) return
            track('draft_meaningful_use', {
                action: 'saved_edit',
                outcome: saved ? 'success' : 'failure',
                draft_id: id,
                ...(saved ? {} : { error_code: 'save_failed' }),
            })
            if (saved) writeDraftFirst(userId, { ...choice, used: true })
        },
        [userId],
    )

    const persistContent = React.useCallback(
        async (id: string, content: any, meaningful: boolean, onUnmount = false) => {
            let saved = false
            try {
                if (onUnmount) {
                    await updateDraftApi(supabase, id, { content })
                    saved = true
                } else {
                    saved = await updateDraftHook(id, { content })
                }
            } catch {}
            recordSavedEdit(id, saved, meaningful)
        },
        [supabase, updateDraftHook, recordSavedEdit],
    )

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
                await persistContent(state.draftId, latestContentRef.current, meaningfulEditRef.current)
            }
            latestContentRef.current = undefined
            meaningfulEditRef.current = false
            latestMediaRef.current = undefined
            loadedEmptyRef.current = false

            // Handle ?import= param (content carried from homepage editor)
            if (importParam) {
                const params = new URLSearchParams(window.location.search)
                if (userId && intentionalDraftImport(window.location.pathname, params)) {
                    const choice = deferPlanning(userId, params)
                    setEntrySource(choice.entrySource)
                }
                let diagnostics: DraftImportDiagnostics | undefined
                try {
                    const mediaKey = params.get('m')
                    const key = `${userId}:${importParam}:${mediaKey}`
                    if (importRef.current?.key !== key) {
                        const pendingDiagnostics: DraftImportDiagnostics = {
                            failure_stage: 'unknown',
                            create_resolved: false,
                        }
                        importRef.current = {
                            key,
                            promise: importDraft(importParam, mediaKey, createDraftHook, pendingDiagnostics),
                            diagnostics: pendingDiagnostics,
                        }
                    }
                    diagnostics = importRef.current.diagnostics
                    const { draft, content: decoded, media } = await importRef.current.promise
                    if (callId !== loadCallRef.current) return
                    loadedEmptyRef.current = !extractPlainText(decoded) && !media
                    const choice = readDraftFirst(userId)
                    if (choice && userId) {
                        writeDraftFirst(userId, { ...choice, draftId: draft.id, used: false })
                        track('draft_import_result', { outcome: 'success', draft_id: draft.id, has_media: !!media })
                    }
                    router.replace(withEntry(`/dashboard/editor?draft=${draft.id}`, entryParam))
                    setState({
                        ...EMPTY,
                        draftId: draft.id,
                        initialContent: decoded,
                        initialMedia: media,
                        label: draft.label,
                        status: draft.status,
                        isLoading: false,
                    })
                } catch {
                    if (callId !== loadCallRef.current) return
                    importRef.current = null
                    track('draft_import_result', {
                        outcome: 'failure',
                        error_code: 'decode_media_or_create',
                        ...draftImportFailureProperties(diagnostics),
                    })
                    toast.error(
                        'Could not import this draft. Your original is safe in the free tool. Please try again.',
                    )
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
                        loadedEmptyRef.current = !extractPlainText(result.content.content) && !result.content.media
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
                        router.replace(withEntry(`/dashboard/editor?draft=${draft.id}`, entryParam))
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
                router.replace(withEntry(`/dashboard/editor?draft=${mostRecent.id}`, entryParam))
                try {
                    const result = await fetchDraft(supabase, mostRecent.id)
                    if (callId !== loadCallRef.current) return
                    loadedEmptyRef.current = !extractPlainText(result?.content.content) && !result?.content.media
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
                    router.replace(withEntry(`/dashboard/editor?draft=${draft.id}`, entryParam))
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
            const typedText = typed !== undefined && !!extractPlainText(typed)
            const addedMedia = latestMediaRef.current !== undefined && !!latestMediaRef.current
            if (loadedEmptyRef.current && !typedText && !addedMedia) {
                void deleteDraftApi(supabase, id).catch(() => {})
            } else if (typed !== undefined) {
                void persistContent(id, typed, meaningfulEditRef.current, true)
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
        (content: any, meaningful = false) => {
            if (!state.draftId) return
            latestContentRef.current = content
            meaningfulEditRef.current = meaningful
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => {
                void persistContent(state.draftId!, content, meaningful)
            }, SAVE_DELAY_MS)
        },
        [state.draftId, persistContent],
    )

    /**
     * Immediately persist the latest pending content edit. Call before publishing
     * or scheduling so the server reads the on-screen text, not a stale debounce.
     */
    const flush = React.useCallback(async () => {
        if (!state.draftId) return
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        if (latestContentRef.current !== undefined) {
            await persistContent(state.draftId, latestContentRef.current, meaningfulEditRef.current)
        }
    }, [state.draftId, persistContent])

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
