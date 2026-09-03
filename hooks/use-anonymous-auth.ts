import { useCallback, useEffect, useRef, useState } from 'react'
import posthog from 'posthog-js'

import { createClient } from '@/lib/supabase/client'

export function useAnonymousAuth() {
    const [isReady, setIsReady] = useState(false)
    const supabaseRef = useRef(createClient())
    const sessionChecked = useRef(false)

    // Check for an existing session on mount
    useEffect(() => {
        if (sessionChecked.current) return
        sessionChecked.current = true

        supabaseRef.current.auth.getSession().then(({ data: { session } }) => {
            if (session) setIsReady(true)
        })
    }, [])

    // Idempotent - returns immediately if already authed
    const ensureSession = useCallback(async () => {
        if (isReady) return true

        try {
            const {
                data: { session },
            } = await supabaseRef.current.auth.getSession()
            if (session) {
                setIsReady(true)
                return true
            }

            const { data, error } = await supabaseRef.current.auth.signInAnonymously()
            if (error || !data.session) {
                posthog.captureException(new Error(`Anonymous auth failed: ${error?.message ?? 'No session returned'}`))
                return false
            }

            setIsReady(true)
            return true
        } catch {
            posthog.captureException(new Error('Anonymous auth failed'))
            return false
        }
    }, [isReady])

    return { isAuthReady: isReady, ensureSession }
}
