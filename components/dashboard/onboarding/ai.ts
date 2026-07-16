// ---------------------------------------------------------------------------
// Onboarding AI + analytics helpers (client-side).
//
// Thin fetch wrappers around the onboarding AI endpoints plus small utilities the
// steps share. Every call degrades gracefully - the endpoints return a 200
// fallback on generation failure, and these wrappers return null on transport
// errors so a screen can fall back without ever showing the user an error.
// ---------------------------------------------------------------------------

import posthog from 'posthog-js'

import type {
    FastIdentity,
    InsightCategory,
    OnboardingInsights,
    RichScrapeStatus,
    RichStatusResponse,
} from '@/types/onboarding'
import { OB_FUNNEL_VERSION } from '@/config/analytics'
import type { Role } from '@/config/onboarding-personalization'
import { toTipTapParagraphs } from '@/lib/parse-formatted-text'
import type { StrategyAudience, StrategyGoal } from '@/lib/strategy'

export type EnrichResult = {
    role: Role
    niche: string
    primaryAudience: StrategyAudience
    toneSummary: string
    opportunityLine: string
    confidence: number
    /** Real identity read from the public profile, when the fetch succeeded. */
    profile?: { name: string; headline: string; avatarUrl: string; about?: string; identity?: FastIdentity }
    /** Rich (Bright Data) scrape state: 'pending' means the pipeline hook should poll. */
    rich?: RichScrapeStatus
}

export type EnrichInput = {
    name?: string
    headline?: string
    profileUrl?: string
    welcomeGoal?: StrategyGoal
}

/** Abort a fetch after `ms`; the caller's catch turns the abort into a fallback. */
async function fetchWithTimeout(input: RequestInfo, init: RequestInit, ms: number): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)
    try {
        return await fetch(input, { ...init, signal: controller.signal })
    } finally {
        clearTimeout(timer)
    }
}

// In-flight dedupe: the Mirror remounts on back-then-forward navigation while an
// enrich is still running; the remount must await the SAME request, not fire a
// second LLM call + a second paid scrape trigger. Module scope survives remounts.
let inflightEnrich: { key: string; promise: Promise<EnrichResult | null> } | null = null

export async function enrichProfile(input: EnrichInput): Promise<EnrichResult | null> {
    const key = JSON.stringify(input)
    if (inflightEnrich?.key === key) return inflightEnrich.promise
    const promise = (async () => {
        try {
            const res = await fetchWithTimeout(
                '/api/onboarding/enrich',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input),
                },
                // Generous: the fast profile fetch (up to ~12s) plus the LLM call.
                // Kept under the server maxDuration and the Mirror failsafe.
                28000,
            )
            if (!res.ok) return null
            return (await res.json()) as EnrichResult
        } catch {
            return null
        }
    })()
    inflightEnrich = { key, promise }
    promise.finally(() => {
        if (inflightEnrich?.key === key) inflightEnrich = null
    })
    return promise
}

/** Poll the rich (Bright Data) scrape; null on transport trouble = try again later. */
export async function fetchRichStatus(): Promise<RichStatusResponse | null> {
    try {
        const res = await fetchWithTimeout('/api/onboarding/enrich/status', {}, 15000)
        if (!res.ok) return null
        return (await res.json()) as RichStatusResponse
    } catch {
        return null
    }
}

export type InsightsHints = { primaryGoal?: StrategyGoal; niche?: string; role?: Role }

/**
 * Generate (or echo, server-side idempotent) the pre-audit insight payload.
 * The hints carry the just-collected goal/role/niche so the analysis is framed
 * around them even before the debounced session write lands.
 */
export async function fetchInsights(hints: InsightsHints = {}): Promise<OnboardingInsights | null> {
    try {
        // Slightly past the route's maxDuration (40s) so the server always gets
        // to answer or die first - the client never abandons a live response.
        const res = await fetchWithTimeout(
            '/api/onboarding/insights',
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(hints) },
            42000,
        )
        if (!res.ok) return null
        return (await res.json()) as OnboardingInsights
    } catch {
        return null
    }
}

export type FirstPostInput = {
    role: string
    niche?: string
    primaryGoal?: StrategyGoal
    audience?: string[]
    tone?: string
    name?: string
    /** Extra author context (e.g. the recap's free-text correction). */
    brandingContext?: string
    /** The missing content category from the insights - the post fills the gap. */
    gapCategory?: InsightCategory
}

export type FirstPostResult = {
    text: string
    /** Whether real scraped posts were used as style references server-side. */
    styled: boolean
}

export async function generateFirstPost(input: FirstPostInput): Promise<FirstPostResult | null> {
    try {
        const res = await fetchWithTimeout(
            '/api/onboarding/first-post',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            },
            25000,
        )
        if (!res.ok) return null
        const data = (await res.json()) as { text?: string; styled?: boolean }
        return typeof data.text === 'string' ? { text: data.text, styled: data.styled === true } : null
    } catch {
        return null
    }
}

/**
 * The paywall's pillar-tagged post previews: one first-post generation per
 * category, in parallel. Failures drop silently - the paywall renders whatever
 * arrived (an empty array hides the section rather than showing mock posts).
 */
export async function generatePostIdeas(
    input: Omit<FirstPostInput, 'gapCategory'>,
    categories: InsightCategory[],
): Promise<{ category: InsightCategory; text: string }[]> {
    const results = await Promise.all(
        categories.map(async (category) => {
            const result = await generateFirstPost({ ...input, gapCategory: category })
            return result ? { category, text: result.text } : null
        }),
    )
    return results.filter((r): r is { category: InsightCategory; text: string } => r !== null)
}

/** Quick refinement of the previewed post via the existing generate pipeline. */
export async function refinePost(
    action: 'shorten' | 'lengthen' | 'variation',
    postText: string,
): Promise<string | null> {
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, postText }),
        })
        if (!res.ok) return null
        const data = (await res.json()) as { result?: string }
        return typeof data.result === 'string' ? data.result : null
    } catch {
        return null
    }
}

/** Wrap formatted post text into a TipTap doc the PostCard + editor both render. */
export function postTextToDoc(text: string) {
    return { type: 'doc', content: toTipTapParagraphs(text) }
}

/** PostHog is uninitialized in dev; optional chaining keeps these no-ops there. */
export function track(event: string, props?: Record<string, unknown>) {
    posthog?.capture(event, { funnel_version: OB_FUNNEL_VERSION, ...props })
}
