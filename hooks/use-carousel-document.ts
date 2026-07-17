'use client'

// ---------------------------------------------------------------------------
// Loads the carousel draft named by ?draft=, builds the editor store from it,
// and autosaves the document back to the same drafts table (kind:'carousel')
// with a debounce. A bare editor URL (no ?draft=) creates a new carousel - from
// ?template= when present, otherwise blank - and redirects to it.
// ---------------------------------------------------------------------------
import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { blankDocument } from '@/lib/carousel/factory'
import { createCarouselStore, type CarouselStore } from '@/lib/carousel/store'
import { getTemplate } from '@/lib/carousel/templates'
import { isCarouselDocument, type CarouselDocument } from '@/lib/carousel/types'
import { fetchDraft, updateDraft } from '@/lib/supabase/drafts'
import { useDrafts } from '@/hooks/use-drafts'
import { useAuth } from '@/components/dashboard/auth-provider'

const SAVE_DELAY_MS = 1500

type State = { draftId: string | null; store: CarouselStore | null; isLoading: boolean }

export function useCarouselDocument() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const draftIdParam = searchParams.get('draft')
    const templateParam = searchParams.get('template')
    const { isReady, supabase } = useAuth()
    const { createDraft } = useDrafts({ kind: 'carousel' })

    const [state, setState] = React.useState<State>({ draftId: null, store: null, isLoading: true })

    const loadCallRef = React.useRef(0)
    const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const draftIdRef = React.useRef<string | null>(null)
    const pendingDocRef = React.useRef<CarouselDocument | null>(null)
    const unsubscribeRef = React.useRef<(() => void) | null>(null)

    const scheduleSave = React.useCallback(
        (doc: CarouselDocument) => {
            const id = draftIdRef.current
            if (!id) return
            pendingDocRef.current = doc
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => {
                pendingDocRef.current = null
                updateDraft(supabase, id, { content: doc }).catch(() => toast.error('Failed to save carousel'))
            }, SAVE_DELAY_MS)
        },
        [supabase],
    )

    // Immediately persist any pending debounced edit (on draft switch / unmount)
    // so the last keystrokes are never dropped when the timer is cleared.
    const flushPending = React.useCallback(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
        const id = draftIdRef.current
        const doc = pendingDocRef.current
        pendingDocRef.current = null
        if (id && doc) updateDraft(supabase, id, { content: doc }).catch(() => {})
    }, [supabase])

    const attachStore = React.useCallback(
        (store: CarouselStore) => {
            unsubscribeRef.current?.()
            unsubscribeRef.current = store.subscribe(() => scheduleSave(store.getSnapshot().doc))
        },
        [scheduleSave],
    )

    React.useEffect(() => {
        if (!isReady) return
        const callId = ++loadCallRef.current

        async function load() {
            // Persist a pending edit for the draft we are leaving, then detach.
            flushPending()
            unsubscribeRef.current?.()
            unsubscribeRef.current = null

            const initialFrom = (doc: CarouselDocument, id: string) => {
                if (callId !== loadCallRef.current) return
                draftIdRef.current = id
                const store = createCarouselStore(doc)
                attachStore(store)
                setState({ draftId: id, store, isLoading: false })
            }

            if (draftIdParam) {
                try {
                    const result = await fetchDraft(supabase, draftIdParam)
                    if (callId !== loadCallRef.current) return
                    if (result && isCarouselDocument(result.content.content)) {
                        initialFrom(result.content.content, draftIdParam)
                        return
                    }
                    // Draft exists but has no carousel yet (or not found): seed a blank one.
                    const seeded = blankDocument()
                    await updateDraft(supabase, draftIdParam, { content: seeded })
                    initialFrom(seeded, draftIdParam)
                } catch {
                    if (callId !== loadCallRef.current) return
                    toast.error('Failed to load carousel')
                    setState({ draftId: null, store: null, isLoading: false })
                }
                return
            }

            // No draft in the URL: create one (from a template if requested) and redirect.
            try {
                const tpl = templateParam ? getTemplate(templateParam) : null
                const doc = tpl ? tpl.build({}) : blankDocument()
                const entry = await createDraft(doc)
                if (callId !== loadCallRef.current) return
                router.replace(`/dashboard/carousel/editor?draft=${entry.id}`)
                initialFrom(doc, entry.id)
            } catch {
                if (callId !== loadCallRef.current) return
                toast.error('Failed to create carousel')
                setState({ draftId: null, store: null, isLoading: false })
            }
        }

        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, draftIdParam, templateParam])

    // Flush + cleanup on unmount.
    React.useEffect(() => {
        return () => {
            unsubscribeRef.current?.()
            flushPending()
        }
    }, [flushPending])

    return state
}
