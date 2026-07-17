'use client'

import * as React from 'react'
import type { User } from '@supabase/supabase-js'
import posthog from 'posthog-js'
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
    /** The authoritative Supabase user (null before the session resolves). */
    user: User | null
    /** The confirmed email on the account, or null for a guest / unconfirmed. */
    email: string | null
    /** A requested-but-unconfirmed email change (user.new_email), if any. */
    pendingEmail: string | null
    /** True while the account is still an anonymous (guest) session. */
    isAnonymous: boolean
}

const AuthContext = React.createContext<AuthContextValue>({
    isReady: false,
    userId: null,
    supabase: null as any,
    user: null,
    email: null,
    pendingEmail: null,
    isAnonymous: true,
})

export function useAuth() {
    return React.useContext(AuthContext)
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

// Stitch the PostHog person to the Supabase user id, so browser events, server
// route events (captureServer), and the onboarding_sessions/billing rows all
// join on one id. Anonymous auth means this is still pseudonymous.
function identifyAnalytics(userId: string) {
    posthog?.identify(userId)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [supabase] = React.useState(() => createClient())
    const [isReady, setIsReady] = React.useState(false)
    const [userId, setUserId] = React.useState<string | null>(null)
    const [user, setUser] = React.useState<User | null>(null)
    const initialized = React.useRef(false)

    // Fold an authoritative user into the exposed identity fields.
    const applyUser = React.useCallback((next: User | null) => {
        setUser(next)
        setUserId(next?.id ?? null)
    }, [])

    React.useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        async function init() {
            // Check existing session first
            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (session) {
                // Prefer the authoritative user (carries email/new_email/is_anonymous).
                const {
                    data: { user: authUser },
                } = await supabase.auth.getUser()
                applyUser(authUser ?? session.user)
                identifyAnalytics(session.user.id)
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
                applyUser(data.session.user)
                identifyAnalytics(data.session.user.id)
                await migrateLocalStorage(supabase, data.session.user.id)
            }
            setIsReady(true)
        }

        init()
    }, [supabase, applyUser])

    // React to session lifecycle events the initial fetch cannot see: an
    // email-confirm finalizing (USER_UPDATED), an OTP/LinkedIn login (SIGNED_IN),
    // logout (SIGNED_OUT), or a background refresh (TOKEN_REFRESHED).
    React.useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                applyUser(null)
                return
            }
            if (session?.user) applyUser(session.user)
        })

        return () => subscription.unsubscribe()
    }, [supabase, applyUser])

    const value = React.useMemo<AuthContextValue>(() => {
        const email = user?.email ?? null
        const pendingEmail = user?.new_email ?? null
        // Supabase marks guest sessions with is_anonymous; treat a missing user
        // as a guest so consumers can render "Guest" before the session resolves.
        const isAnonymous = user ? Boolean(user.is_anonymous) : true
        return { isReady, userId, supabase, user, email, pendingEmail, isAnonymous }
    }, [isReady, userId, supabase, user])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
