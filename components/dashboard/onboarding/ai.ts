// ---------------------------------------------------------------------------
// Onboarding AI + analytics helpers (client-side).
//
// Thin fetch wrappers around the onboarding AI endpoints plus small utilities the
// steps share. Every call degrades gracefully - the endpoints return a 200
// fallback on generation failure, and these wrappers return null on transport
// errors so a screen can fall back without ever showing the user an error.
// ---------------------------------------------------------------------------

import posthog from 'posthog-js'

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
}

export type EnrichInput = {
    name?: string
    headline?: string
    vanityUrl?: string
    profileUrl?: string
    welcomeGoal?: StrategyGoal
}

export async function enrichProfile(input: EnrichInput): Promise<EnrichResult | null> {
    try {
        const res = await fetch('/api/onboarding/enrich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        })
        if (!res.ok) return null
        return (await res.json()) as EnrichResult
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
}

export async function generateFirstPost(input: FirstPostInput): Promise<string | null> {
    try {
        const res = await fetch('/api/onboarding/first-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        })
        if (!res.ok) return null
        const data = (await res.json()) as { text?: string }
        return typeof data.text === 'string' ? data.text : null
    } catch {
        return null
    }
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
    posthog?.capture(event, props)
}
