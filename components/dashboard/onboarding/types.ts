// ---------------------------------------------------------------------------
// Onboarding shared types + persistence helpers.
//
// The wizard holds every answer in local state and writes once at the end (with
// an optional incremental write after generation). The only place we touch
// storage mid-flow is the LinkedIn step, which navigates away from the app: we
// stash answers in localStorage so we can rehydrate when the OAuth callback
// lands us back in the dashboard. See onboarding-controller.tsx.
// ---------------------------------------------------------------------------

import type { BrandingData, BrandingRole, BrandingWritingStyle } from '@/lib/branding'
import type { ScheduleSlot, StrategyAudience, StrategyData, StrategyFormat, StrategyGoal } from '@/lib/strategy'

export type OnboardingAnswers = {
    profile: { name: string; headline: string; avatarUrl: string }
    role: BrandingRole
    goals: StrategyGoal[]
    audience: StrategyAudience[]
    topics: string[]
    writingStyle: BrandingWritingStyle
    frequency: number
    schedule: ScheduleSlot[]
    // Generated in the "Building your setup" step.
    positioning: string
    formats: StrategyFormat[]
    linkedinConnected: boolean
}

/** Seed the wizard from whatever the user already has, so partial setups prefill. */
export function initialAnswers(branding: BrandingData, strategy: StrategyData): OnboardingAnswers {
    return {
        profile: { ...branding.profile },
        role: branding.role,
        goals: strategy.goals,
        audience: strategy.audience,
        topics: branding.expertise.topics.length ? branding.expertise.topics : [],
        writingStyle: { ...branding.writingStyle },
        frequency: strategy.frequency,
        schedule: strategy.schedule,
        positioning: branding.positioning.statement,
        formats: strategy.formats,
        linkedinConnected: false,
    }
}

// --- LinkedIn redirect resume ---------------------------------------------

const STORAGE_KEY = 'lp-onboarding-state'

type ResumeState = {
    answers: OnboardingAnswers
    /** Step id to resume the LinkedIn round-trip at. */
    resumeAt: 'linkedin'
}

export function persistResume(answers: OnboardingAnswers) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, resumeAt: 'linkedin' } satisfies ResumeState))
    } catch {}
}

export function readResume(): ResumeState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        return JSON.parse(raw) as ResumeState
    } catch {
        return null
    }
}

export function clearResume() {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch {}
}
