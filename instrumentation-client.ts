import posthog, { type CaptureResult } from 'posthog-js'

import { getConsent } from '@/lib/consent'

// ---------------------------------------------------------------------------
// Third-party exception filter
//
// capture_exceptions reports every uncaught error on the page, including ones
// thrown entirely inside vendor bundles we mount but do not own - most visibly
// the Featurebase messenger (do.featurebase.app/js/sdk.js), which throws a
// ChunkLoadError on the dashboard. Those are not ours and not actionable, and
// because the issue fingerprint keys on the minified frame name, every vendor
// re-minify opens a brand-new issue. We drop an exception only when every stack
// frame resolves to a non-first-party origin. Anything touching our own code
// keeps reporting - a relative path, or a full linkedinpreview.com/_next/static
// URL (e.g. the Turbopack chunk errors we do want to see).
// ---------------------------------------------------------------------------

function frameOrigin(filename: unknown): string | null {
    if (typeof filename !== 'string' || filename.length === 0) return null
    try {
        return new URL(filename, window.location.origin).origin
    } catch {
        return null
    }
}

function isThirdPartyException(properties: CaptureResult['properties'] | undefined): boolean {
    const exceptions = properties?.['$exception_list']
    if (!Array.isArray(exceptions) || exceptions.length === 0) return false

    const frames = exceptions.flatMap((exception) => exception?.stacktrace?.frames ?? [])
    if (frames.length === 0) return false

    // A frame with no resolvable URL (inline, eval, anonymous) counts as unknown
    // and keeps the exception - we never drop on incomplete information.
    return frames.every((frame) => {
        const origin = frameOrigin(frame?.filename)
        return origin !== null && origin !== window.location.origin
    })
}

if (process.env.NODE_ENV === 'production') {
    const consented = getConsent() === 'accepted'

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: '/ingest',
        ui_host: 'https://eu.posthog.com',
        capture_exceptions: true,
        before_send: (event) => {
            if (event?.event === '$exception' && isThirdPartyException(event.properties)) {
                return null
            }
            return event
        },
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
