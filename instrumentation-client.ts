import posthog from 'posthog-js'

import { getConsent } from '@/lib/consent'

if (process.env.NODE_ENV === 'production') {
    const consented = getConsent() === 'accepted'

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: '/ingest',
        ui_host: 'https://eu.posthog.com',
        capture_exceptions: true,
        // Consent model: cookieless until the banner is accepted - memory-only
        // persistence (no device identifiers) and no replay. Accepting upgrades
        // to persistent cookies + replay at runtime (hooks/use-consent.ts).
        persistence: consented ? 'localStorage+cookie' : 'memory',
        disable_session_recording: !consented,
        // Replay itself is toggled in the PostHog project settings; this config
        // guarantees that when it is on, no typed input (profile URLs, payment
        // fields) ever lands in a recording. Onboarding renders scraped personal
        // data as text, so sensitive blocks opt out via the .ph-no-capture class.
        session_recording: {
            maskAllInputs: true,
        },
    })
}
