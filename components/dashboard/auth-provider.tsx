'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'

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
// Migration
// ---------------------------------------------------------------------------

async function migrateLocalStorage(client: ReturnType<typeof createClient>, uid: string) {
    const MIGRATION_KEY = 'lp-migrated-to-supabase'
    if (localStorage.getItem(MIGRATION_KEY)) return

    try {
        // Migrate drafts
        const manifestRaw = localStorage.getItem('lp-drafts-manifest')
        if (manifestRaw) {
            const manifest = JSON.parse(manifestRaw) as Array<any>
            for (const entry of manifest) {
                const contentRaw = localStorage.getItem(`lp-draft-${entry.id}`)
                const content = contentRaw ? JSON.parse(contentRaw) : null

                const { data: existing } = await client.from('drafts').select('id').eq('id', entry.id).maybeSingle()

                if (!existing) {
                    await client.from('drafts').insert({
                        id: entry.id,
                        user_id: uid,
                        title: entry.title || 'Untitled',
                        content: content?.content ?? null,
                        media: content?.media ?? null,
                        status: entry.status || 'draft',
                        word_count: entry.wordCount || 0,
                        char_count: entry.charCount || 0,
                        created_at: new Date(entry.createdAt || Date.now()).toISOString(),
                        updated_at: new Date(entry.updatedAt || Date.now()).toISOString(),
                    })
                }
            }
        }

        // Migrate branding
        const brandingRaw = localStorage.getItem('lp-branding')
        if (brandingRaw) {
            const brandingData = JSON.parse(brandingRaw)
            await client.from('branding').upsert(
                {
                    user_id: uid,
                    data: brandingData,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' },
            )
        }

        localStorage.setItem(MIGRATION_KEY, '1')
    } catch {
        toast.error('Failed to migrate local data')
    }
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
