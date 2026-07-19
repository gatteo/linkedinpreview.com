'use client'

import React from 'react'
import { toast } from 'sonner'

/**
 * Local autosave for the public tool.
 *
 * Every tool mount point shares one key holding the bare TipTap document, which is
 * the shape and the location drafts have always used, so nothing already saved has
 * to be moved or migrated. Writes are debounced but always flushed on unmount, tab
 * hide and page unload, so closing the tab mid-sentence keeps the work.
 *
 * Cross-tab behavior is plain last-write-wins.
 */

const STORAGE_KEY = 'linkedinpreview-draft'
const BACKUP_KEY = 'linkedinpreview-draft:backup'
const SAVE_DELAY_MS = 2000

function readKey(key: string): any | null {
    try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export function readStoredDraft(): any | null {
    return readKey(STORAGE_KEY)
}

/** Copies the saved draft aside so an incoming document never destroys it. */
export function backupStoredDraft(): boolean {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return false
        localStorage.setItem(BACKUP_KEY, raw)
        return true
    } catch {
        return false
    }
}

/** Reads and clears the copy left by `backupStoredDraft`. */
export function takeBackupDraft(): any | null {
    const backup = readKey(BACKUP_KEY)
    try {
        localStorage.removeItem(BACKUP_KEY)
    } catch {
        // storage unavailable - the read failed too, so there is nothing to clear
    }
    return backup
}

export function useDraftPersistence(content: any) {
    const timerRef = React.useRef<ReturnType<typeof setTimeout>>(null)
    const pendingRef = React.useRef<any>(null)
    const failureReportedRef = React.useRef(false)

    const flush = React.useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        const pending = pendingRef.current
        if (pending == null) return
        pendingRef.current = null

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pending))
        } catch {
            if (failureReportedRef.current) return
            failureReportedRef.current = true
            toast.error('Autosave is unavailable', {
                description:
                    'Your browser is blocking local storage, so this draft will not be saved. Copy your text before leaving.',
                duration: 12000,
            })
        }
    }, [])

    React.useEffect(() => {
        if (content == null) return
        pendingRef.current = content
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(flush, SAVE_DELAY_MS)
    }, [content, flush])

    // Flush on tab hide, page unload and unmount. Without this every edit still
    // inside the debounce window is dropped, which is the work users report losing.
    React.useEffect(() => {
        const handlePageHide = () => flush()
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') flush()
        }

        window.addEventListener('pagehide', handlePageHide)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            window.removeEventListener('pagehide', handlePageHide)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            flush()
        }
    }, [flush])

    return { flush }
}
