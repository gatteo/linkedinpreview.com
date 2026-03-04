'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { migrateLocalStorage } from '@/lib/supabase/migrate'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type AuthContextValue = {
    isReady: boolean
    userId: string | null
    supabase: ReturnType<typeof createClient>
}

const AuthContext = React.createContext<AuthContextValue>({
    isReady: false,
    userId: null,
    supabase: null as any,
})

export function useAuth() {
    return React.useContext(AuthContext)
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [supabase] = React.useState(() => createClient())
    const [isReady, setIsReady] = React.useState(false)
    const [userId, setUserId] = React.useState<string | null>(null)
    const initialized = React.useRef(false)

    React.useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        async function init() {
            // Check existing session first
            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (session) {
                setUserId(session.user.id)
                setIsReady(true)
                await migrateLocalStorage(supabase, session.user.id)
                return
            }

            // Sign in anonymously
            const { data, error } = await supabase.auth.signInAnonymously()
            if (error) {
                toast.error('Failed to initialize session')
                // Still mark as ready so the UI does not hang
                setIsReady(true)
                return
            }

            if (data.session) {
                setUserId(data.session.user.id)
                await migrateLocalStorage(supabase, data.session.user.id)
            }
            setIsReady(true)
        }

        init()
    }, [supabase])

    const value = React.useMemo(() => ({ isReady, userId, supabase }), [isReady, userId, supabase])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
