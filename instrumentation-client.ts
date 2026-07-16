import posthog from 'posthog-js'

if (process.env.NODE_ENV === 'production') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: '/ingest',
        ui_host: 'https://eu.posthog.com',
        capture_exceptions: true,
        // Replay itself is toggled in the PostHog project settings; this config
        // guarantees that when it is on, no typed input (profile URLs, payment
        // fields) ever lands in a recording. Onboarding renders scraped personal
        // data as text, so sensitive blocks opt out via the .ph-no-capture class.
        session_recording: {
            maskAllInputs: true,
        },
    })
}
