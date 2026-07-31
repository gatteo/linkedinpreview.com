import posthog from 'posthog-js'
import type { CaptureResult } from 'posthog-js'

import { getConsent } from '@/lib/consent'

// ---------------------------------------------------------------------------
// Exception noise filter
//
// capture_exceptions hooks the page's global error handlers, so we also
// receive errors we can never fix: browser-extension content scripts, injected
// eval'd blobs, and crawler shims (Outlook SafeLinks). Their frames resolve to
// chrome-extension:// / moz-extension:// origins or to <anonymous>, never to a
// file we serve. before_send drops those before ingest so error tracking only
// opens issues for our own code.
// ---------------------------------------------------------------------------

const APP_HOSTNAME = 'linkedinpreview.com'

// Substrings of $exception values that are always non-actionable: benign
// browser warnings, cross-origin errors with no detail, and crawler probes.
const BENIGN_EXCEPTION_VALUES = [
    'ResizeObserver loop', // layout-timing warning, not a crash
    'Script error.', // cross-origin script, stripped of all detail
    'Object Not Found Matching Id', // Outlook SafeLinks crawler
    'CustomEvent captured as exception', // a CustomEvent surfaced as an error
]

const EXTENSION_SCHEME = /^(chrome|moz|safari|safari-web)-extension:/

type ExceptionFrame = { filename?: unknown }
type ExceptionItem = { value?: unknown; stacktrace?: { frames?: unknown } }

// A frame is "first party" when it points at a file we actually serve. Extension
// schemes and <anonymous> never are; bundler-internal paths that are not URLs
// come from our own build, so we keep them.
function frameIsFirstParty(frame: ExceptionFrame): boolean {
    const filename = typeof frame?.filename === 'string' ? frame.filename : ''
    if (!filename || filename === '<anonymous>') return false
    if (EXTENSION_SCHEME.test(filename)) return false
    try {
        const host = new URL(filename).hostname
        // Non-network schemes (e.g. bundler-internal or blob: URLs) parse with an
        // empty hostname. They are not extensions, so treat them as ours.
        if (!host) return true
        const selfHost = typeof window !== 'undefined' ? window.location.hostname : ''
        return host === APP_HOSTNAME || host.endsWith(`.${APP_HOSTNAME}`) || (!!selfHost && host === selfHost)
    } catch {
        return true
    }
}

function isNonAppException(properties: Record<string, unknown> | undefined): boolean {
    const list = Array.isArray(properties?.$exception_list) ? (properties!.$exception_list as ExceptionItem[]) : []

    const matchesDenylist = list.some((item) => {
        const value = typeof item?.value === 'string' ? item.value : ''
        return BENIGN_EXCEPTION_VALUES.some((benign) => value.includes(benign))
    })
    if (matchesDenylist) return true

    const frames = list.flatMap((item) =>
        Array.isArray(item?.stacktrace?.frames) ? (item.stacktrace!.frames as ExceptionFrame[]) : [],
    )
    // Keep frameless exceptions (a bare throw could still be ours). Drop only
    // when there are frames and every one is anonymous or off-origin.
    if (frames.length === 0) return false
    return frames.every((frame) => !frameIsFirstParty(frame))
}

function filterExceptionNoise(event: CaptureResult | null): CaptureResult | null {
    if (event?.event === '$exception' && isNonAppException(event.properties)) return null
    return event
}

if (process.env.NODE_ENV === 'production') {
    const consented = getConsent() === 'accepted'

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: '/ingest',
        ui_host: 'https://eu.posthog.com',
        capture_exceptions: true,
        before_send: filterExceptionNoise,
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
