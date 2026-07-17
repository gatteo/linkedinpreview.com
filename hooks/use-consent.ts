'use client'

import * as React from 'react'
import posthog from 'posthog-js'

import { getConsent, onConsentChange, setConsent, type ConsentChoice } from '@/lib/consent'

// Reads null until mounted (SSR-safe), then the stored choice; accept()
// upgrades PostHog from the cookieless boot mode to persistent cookies and
// enables session replay (replay itself is toggled in the PostHog project).
export function useConsent() {
    const [consent, setState] = React.useState<ConsentChoice | null>(null)
    const [isReady, setIsReady] = React.useState(false)

    React.useEffect(() => {
        setState(getConsent())
        setIsReady(true)
        return onConsentChange(setState)
    }, [])

    const accept = React.useCallback(() => {
        setConsent('accepted')
        posthog?.set_config({ persistence: 'localStorage+cookie', disable_session_recording: false })
    }, [])

    const decline = React.useCallback(() => {
        setConsent('declined')
    }, [])

    return { consent, isReady, accept, decline }
}
