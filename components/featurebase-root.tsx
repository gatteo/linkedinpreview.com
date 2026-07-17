'use client'

import * as React from 'react'
import { FeaturebaseProvider, useFeaturebase } from 'featurebase-js/react'
import { useTheme } from 'next-themes'

import { useAuth } from '@/components/dashboard/auth-provider'

// ---------------------------------------------------------------------------
// Featurebase messenger (support + feedback)
//
// Mounted once in the dashboard layout - the portal is the only surface where
// the messenger should appear. Public pages, /embed, and /preview stay clean.
// The SDK reads the workspace's "Manage modules" toggles server-side, so
// enabled surfaces boot without per-surface flags here.
//
// Identity: the provider boots anonymously, then upgrades in place when the
// server-signed JWT arrives (fetched by FeaturebaseIdentity, which lives
// below AuthProvider). When FEATUREBASE_JWT_SECRET is unset the route
// returns 503 and the messenger simply stays anonymous.
// ---------------------------------------------------------------------------

const FEATUREBASE_APP_ID = '6a59ce40db775d4fca119bd4'

const JwtSetterContext = React.createContext<(jwt: string) => void>(() => {})

export function FeaturebaseRoot({ children }: { children: React.ReactNode }) {
    const { resolvedTheme } = useTheme()
    const [jwt, setJwt] = React.useState<string>()

    const theme = resolvedTheme === undefined ? undefined : resolvedTheme === 'dark' ? 'dark' : 'light'

    return (
        <JwtSetterContext.Provider value={setJwt}>
            <FeaturebaseProvider appId={FEATUREBASE_APP_ID} theme={theme} featurebaseJwt={jwt}>
                <FeaturebaseThemeSync />
                {children}
            </FeaturebaseProvider>
        </JwtSetterContext.Provider>
    )
}

// The provider prop only sets the boot theme (and its boot effect ignores
// later prop changes), so runtime sync goes through setTheme. setTheme calls
// made before the messenger boots are dropped, and the SDK's whenReady lives
// in a different bundle instance than the react entry that actually boots -
// so readiness is detected by polling for the messenger's root element.
function FeaturebaseThemeSync() {
    const { resolvedTheme } = useTheme()
    const { setTheme } = useFeaturebase()

    React.useEffect(() => {
        if (resolvedTheme === undefined) return
        const theme = resolvedTheme === 'dark' ? 'dark' : 'light'

        if (document.getElementById('fb-messenger-root')) {
            setTheme(theme)
            return
        }

        let attempts = 0
        const interval = window.setInterval(() => {
            attempts += 1
            if (document.getElementById('fb-messenger-root')) {
                window.clearInterval(interval)
                setTheme(theme)
                // Re-apply once: the root can exist a beat before the widget
                // starts listening for theme updates.
                window.setTimeout(() => setTheme(theme), 1000)
            } else if (attempts > 100) {
                window.clearInterval(interval)
            }
        }, 300)

        return () => window.clearInterval(interval)
    }, [resolvedTheme, setTheme])

    return null
}

// Mounted inside AuthProvider (which sits below this file's provider) so it
// can wait for the Supabase session before requesting the identity JWT.
export function FeaturebaseIdentity() {
    const { isReady, userId } = useAuth()
    const setJwt = React.useContext(JwtSetterContext)

    React.useEffect(() => {
        if (!isReady || !userId) return
        let cancelled = false

        fetch('/api/featurebase/jwt')
            .then(async (res) => {
                if (!res.ok) return
                const data = (await res.json()) as { jwt?: string }
                if (!cancelled && data.jwt) setJwt(data.jwt)
            })
            .catch(() => {})

        return () => {
            cancelled = true
        }
    }, [isReady, userId, setJwt])

    return null
}
