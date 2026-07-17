import { PostHog } from 'posthog-node'

import { env } from '@/env.mjs'

// ---------------------------------------------------------------------------
// Server-side PostHog capture. The client SDK only sees what the browser
// observes; API routes use this for the outcomes a closed tab never reports
// (provider failures, scrape settlements, LLM degrades, webhook conversions).
//
// distinctId is always the Supabase user id - the client identify() call in
// AuthProvider makes these events land on the same PostHog person as the
// browser events. Call sites wrap in `after()` so capture never adds latency.
// ---------------------------------------------------------------------------

let client: PostHog | null = null

function getClient(): PostHog | null {
    if (env.NODE_ENV !== 'production' || !env.NEXT_PUBLIC_POSTHOG_KEY) return null
    // Serverless: send immediately, never rely on a batching interval that a
    // frozen function would drop.
    client ??= new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
        host: 'https://eu.i.posthog.com',
        flushAt: 1,
        flushInterval: 0,
    })
    return client
}

/** Fire one server event. Never throws - analytics must not break a request. */
export async function captureServer(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>,
): Promise<void> {
    const posthog = getClient()
    if (!posthog) return
    try {
        await posthog.captureImmediate({ distinctId, event, properties })
    } catch {
        // Swallow: an unreachable analytics host is not a request failure.
    }
}
