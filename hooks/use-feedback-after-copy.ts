'use client'

import React from 'react'
import posthog from 'posthog-js'

import { feedbackConfig } from '@/config/feedback'
import {
    discoveryAvailable,
    discoveryOverlap,
    discoverySource,
    JOB_DISCOVERY_KEY,
    type DiscoverySource,
    type VisitorJob,
} from '@/lib/post-copy-discovery'

const { postCopy, storage, formId } = feedbackConfig

function isDismissCooldownActive(): boolean {
    const dismissedAt = localStorage.getItem(storage.dismissedAt)
    if (!dismissedAt) return false
    const elapsed = Date.now() - Number(dismissedAt)
    return elapsed < postCopy.dismissCooldownDays * 24 * 60 * 60 * 1000
}

function getCopyCount(): number {
    return Number(localStorage.getItem(storage.copyCount) || '0')
}

function incrementCopyCount(): number {
    const next = getCopyCount() + 1
    localStorage.setItem(storage.copyCount, String(next))
    return next
}

export function useFeedbackAfterCopy() {
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const [question, setQuestion] = React.useState<{
        source: DiscoverySource
        experiment_overlap: 'local_marker_present' | 'unknown'
    } | null>(null)
    const answeredRef = React.useRef(false)

    const finishQuestion = React.useCallback(
        (job?: VisitorJob) => {
            if (!question || answeredRef.current) return
            answeredRef.current = true
            setQuestion(null)
            try {
                posthog?.capture(job ? 'post_copy_job_answered' : 'post_copy_job_dismissed', {
                    ...question,
                    ...(job ? { job } : {}),
                })
            } catch {}
        },
        [question],
    )

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    const notifyCopy = React.useCallback((contentLength: number) => {
        try {
            // Third-party embeds never solicit feedback, even when framed on a public route.
            if (window.self !== window.top || window.location.pathname === '/embed') return
            const source = discoverySource(window.location.pathname, false)
            if (source) {
                if (contentLength <= 0) return
                const storedCount = getCopyCount()
                const count = Number.isSafeInteger(storedCount) && storedCount >= 0 ? storedCount + 1 : 1
                localStorage.setItem(storage.copyCount, String(count))
                if (count < postCopy.minCopyCount || timeoutRef.current) return
                if (!discoveryAvailable(localStorage, sessionStorage, Date.now())) return
                const properties = { source, experiment_overlap: discoveryOverlap(localStorage, sessionStorage) }
                try {
                    posthog?.capture('post_copy_job_eligible', properties)
                } catch {}
                timeoutRef.current = setTimeout(() => {
                    timeoutRef.current = null
                    try {
                        if (window.location.pathname !== (source === 'homepage' ? '/' : '/formatter')) return
                        if (!discoveryAvailable(localStorage, sessionStorage, Date.now())) return
                        // Persist before rendering. Unavailable storage suppresses solicitation, never copy.
                        localStorage.setItem(JOB_DISCOVERY_KEY, String(Date.now()))
                        answeredRef.current = false
                        setQuestion(properties)
                    } catch {}
                }, postCopy.delayMs)
                return
            }

            if (!formId) return

            if (contentLength < postCopy.minContentLength) return

            const count = incrementCopyCount()
            if (count < postCopy.minCopyCount || timeoutRef.current) return

            // Once per session
            if (sessionStorage.getItem(storage.sessionShown)) return

            // 7-day cooldown after dismiss
            if (isDismissCooldownActive()) return

            timeoutRef.current = setTimeout(() => {
                timeoutRef.current = null
                try {
                    // Coalesce legacy automatic feedback with the public discovery cooldown.
                    const shownAt = Number(localStorage.getItem(JOB_DISCOVERY_KEY))
                    if (shownAt && Date.now() - shownAt < postCopy.dismissCooldownDays * 24 * 60 * 60 * 1000) return
                    sessionStorage.setItem(storage.sessionShown, '1')

                    window.Tally?.openPopup(formId, {
                        hiddenFields: {
                            source: 'post-copy',
                            pageUrl: window.location.href,
                            copyCount: String(count),
                        },
                        onClose: () => {
                            try {
                                localStorage.setItem(storage.dismissedAt, String(Date.now()))
                            } catch {}
                        },
                    })
                } catch {}
            }, postCopy.delayMs)
        } catch {}
    }, [])

    return { notifyCopy, question, finishQuestion }
}
