'use client'

import React from 'react'

import { feedbackConfig } from '@/config/feedback'

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

export function useFeedbackAfterCopy(onShow?: () => boolean) {
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const onShowRef = React.useRef(onShow)
    React.useEffect(() => {
        onShowRef.current = onShow
    }, [onShow])

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    const notifyCopy = React.useCallback((contentLength: number) => {
        if (!formId && !onShowRef.current) return

        try {
            if (contentLength < postCopy.minContentLength) return

            const count = incrementCopyCount()
            if (count < postCopy.minCopyCount) return

            // Once per session
            if (sessionStorage.getItem(storage.sessionShown)) return

            // 7-day cooldown after dismiss
            if (isDismissCooldownActive()) return

            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
                try {
                    sessionStorage.setItem(storage.sessionShown, '1')

                    if (onShowRef.current?.()) return

                    window.Tally?.openPopup(formId, {
                        hiddenFields: {
                            source: 'post-copy',
                            pageUrl: window.location.href,
                            copyCount: String(count),
                        },
                        onClose: () => {
                            localStorage.setItem(storage.dismissedAt, String(Date.now()))
                        },
                    })
                } catch {}
            }, postCopy.delayMs)
        } catch {}
    }, [])

    return { notifyCopy }
}
