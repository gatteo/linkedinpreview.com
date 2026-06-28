// ---------------------------------------------------------------------------
// Onboarding shared types + persistence helpers.
//
// The conversion-redesign flow (docs/onboarding-conversion-redesign.md) alternates
// COLLECT and REINFORCE/PREVIEW beats and ends on a soft offer. It is longer and
// AI-laden, so we persist answers + the current step to localStorage after every
// step (incremental persistence, §5.1): an accidental refresh or the LinkedIn
// OAuth round-trip rehydrates without losing progress or re-spending AI calls.
// ---------------------------------------------------------------------------

import type { Tone } from '@/config/ai'
import type { Cadence } from '@/config/onboarding-personalization'
import type { BrandingData, BrandingRole, BrandingWritingStyle } from '@/lib/branding'
import type { ScheduleSlot, StrategyAudience, StrategyData, StrategyFormat, StrategyGoal } from '@/lib/strategy'

// The new step machine (§2). 'done' is the terminal celebration/handoff screen.
export type StepId =
    | 'welcome'
    | 'connect'
    | 'mirror'
    | 'goal'
    | 'proof'
    | 'preview'
    | 'voice'
    | 'spotlight'
    | 'cadence'
    | 'building'
    | 'recap'
    | 'offer'
    | 'done'

export type OnboardingAnswers = {
    profile: { name: string; headline: string; avatarUrl: string }
    role: BrandingRole
    goals: StrategyGoal[]
    audience: StrategyAudience[]
    topics: string[]
    writingStyle: BrandingWritingStyle
    frequency: number
    schedule: ScheduleSlot[]
    // Generated in the "Building your system" step.
    positioning: string
    formats: StrategyFormat[]
    linkedinConnected: boolean

    // --- Conversion-redesign additions (§5.1) ---
    /** Motivation seed from Welcome; the primary goal that re-skins offer/recap. */
    primaryGoal?: StrategyGoal
    /** Pasted profile URL when the user doesn't OAuth (enrichment context only). */
    profileUrl?: string
    /** Inferred niche (e.g. "B2B SaaS growth"), confirmed on the Mirror screen. */
    niche?: string
    /** Inferred writing tone phrase (e.g. "direct and practical"). */
    toneSummary?: string
    /** Role-aware "biggest opportunity" line shown on the Mirror screen. */
    opportunityLine?: string
    /** Confidence (0-1) the enrichment returned; gates the "guessed" Mirror UI. */
    enrichConfidence?: number
    /** The first generated post, stashed as a draft so it survives into the dashboard. */
    firstDraftId?: string
    /** The first post text kept in state for the Voice/Recap screens. */
    firstPostText?: string
    /** Posting cadence commitment (maps to frequency + schedule). */
    cadence?: Cadence
    /** Confirmed tone for generation. */
    tone?: Tone
    /** Optional "anything we should avoid?" note (maps to dos/donts). */
    writingNotes?: string
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
        primaryGoal: strategy.goals[0],
    }
}

// --- Incremental persistence + LinkedIn redirect resume --------------------

const STORAGE_KEY = 'lp-onboarding-state'

export type OnboardingResumeState = {
    answers: OnboardingAnswers
    /** Step id to resume at on the next mount. */
    resumeAt: StepId
}

export function persistOnboarding(answers: OnboardingAnswers, resumeAt: StepId) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, resumeAt } satisfies OnboardingResumeState))
    } catch {}
}

export function readOnboarding(): OnboardingResumeState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        return JSON.parse(raw) as OnboardingResumeState
    } catch {
        return null
    }
}

export function clearOnboarding() {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch {}
}
