// ---------------------------------------------------------------------------
// Onboarding shared types + persistence helpers.
//
// The conversion-redesign flow (docs/onboarding-conversion-redesign.md) alternates
// COLLECT and REINFORCE/PREVIEW beats and ends on a soft offer. It is longer and
// AI-laden, so we persist answers + the current step to localStorage after every
// step (incremental persistence, §5.1): an accidental refresh or the LinkedIn
// OAuth round-trip rehydrates without losing progress or re-spending AI calls.
// ---------------------------------------------------------------------------

import type { InsightCategory, OnboardingInsights, RichScrapeStatus, RichSummary } from '@/types/onboarding'
import type { Tone } from '@/config/ai'
import type { Cadence } from '@/config/onboarding-personalization'
import type { BrandingData, BrandingRole, BrandingWritingStyle } from '@/lib/branding'
import type { ScheduleSlot, StrategyAudience, StrategyData, StrategyFormat, StrategyGoal } from '@/lib/strategy'

// The step machine, single source of truth (StepId derives from it). Questions
// (goal/voice/cadence) sit right after the mirror so the 42-60s rich scrape
// completes while the user answers; reinforce + building absorb the tail;
// insights is the payoff right before the prescription (preview) and the offer.
// 'done' is the terminal celebration/handoff screen.
export const STEP_ORDER = [
    'welcome',
    'connect',
    'mirror',
    'goal',
    'voice',
    'cadence',
    'reinforce',
    'building',
    'insights',
    'preview',
    'recap',
    'offer',
    'done',
] as const

export type StepId = (typeof STEP_ORDER)[number]

// Pre-v2 blobs come from the old step order: proof/spotlight no longer exist,
// and reinforce/preview MOVED past the question steps - resuming an old blob at
// either would skip goal/voice/cadence entirely, so they map to the nearest
// question step instead.
const V1_RESUME: Record<string, StepId> = {
    proof: 'goal',
    spotlight: 'cadence',
    reinforce: 'goal',
    preview: 'cadence',
}

const STATE_VERSION = 2

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
    /** Raw Welcome option keys the user picked, kept so back-navigation restores
     *  the selection (goals are lossy - many options map to one goal). */
    welcomeSelections?: string[]
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
    /** Sticky "I'll enter it by hand" choice on the Mirror after a URL fetch fails,
     *  so a remount / Back-nav doesn't re-show the error over the finished form. */
    mirrorManual?: boolean
    /** The first post text kept in state for the Voice/Recap screens. */
    firstPostText?: string
    /** Whether the first post was written against real scraped posts as style references. */
    firstPostStyled?: boolean
    /** The gap category the CURRENT first post was written to fill (set at generation
     *  time, so the preview header never claims a gap an older post was not written for). */
    firstPostGap?: InsightCategory
    /** Posting cadence commitment (maps to frequency + schedule). */
    cadence?: Cadence
    /** Confirmed tone for generation. */
    tone?: Tone
    /** Optional "anything we should avoid?" note (maps to dos/donts). */
    writingNotes?: string

    // --- Rich enrichment pipeline (two-tier fetch) --------------------------
    /** Rich (Bright Data) scrape lifecycle; persisted so a reload resumes polling. */
    richStatus?: RichScrapeStatus
    /** Slim rich summary (post count, followers, observed cadence) once the scrape lands. */
    richSummary?: RichSummary
    /** Insight payload from /api/onboarding/insights (the pre-offer analysis cards). */
    insights?: OnboardingInsights
    /** Only terminal states persist; in-flight generation lives in the pipeline hook. */
    insightsStatus?: 'ready' | 'failed'
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
    /** Blob shape/step-order version. */
    v?: number
}

export function persistOnboarding(answers: OnboardingAnswers, resumeAt: StepId) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ v: STATE_VERSION, answers, resumeAt } satisfies OnboardingResumeState),
        )
    } catch {}
}

export function readOnboarding(): OnboardingResumeState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as OnboardingResumeState
        // Guard against stale/corrupt blobs from an older shape so the gate that
        // reads `answers.profile` can never throw and silently drop the user.
        if (!parsed?.answers?.profile || typeof parsed.resumeAt !== 'string') return null
        if (parsed.v !== STATE_VERSION) {
            parsed.resumeAt =
                V1_RESUME[parsed.resumeAt] ??
                ((STEP_ORDER as readonly string[]).includes(parsed.resumeAt) ? parsed.resumeAt : 'welcome')
        } else if (!(STEP_ORDER as readonly string[]).includes(parsed.resumeAt)) {
            parsed.resumeAt = 'welcome'
        }
        return parsed
    } catch {
        return null
    }
}

export function clearOnboarding() {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch {}
}
