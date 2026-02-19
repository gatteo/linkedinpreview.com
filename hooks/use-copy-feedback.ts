'use client'

import { useCallback, useState } from 'react'

const STORAGE_KEY = 'copy-feedback-last-shown'
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function useCopyFeedback() {
    const [visible, setVisible] = useState(false)

    const shouldShow = useCallback((): boolean => {
        try {
            const last = localStorage.getItem(STORAGE_KEY)
            if (!last) return true
            return Date.now() - Number(last) > COOLDOWN_MS
        } catch {
            return false
        }
    }, [])

    const show = useCallback(() => {
        if (!shouldShow()) return
        try {
            localStorage.setItem(STORAGE_KEY, String(Date.now()))
        } catch {}
        setVisible(true)
    }, [shouldShow])

    const hide = useCallback(() => {
        setVisible(false)
    }, [])

    return { visible, show, hide }
}
