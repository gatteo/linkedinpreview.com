// ---------------------------------------------------------------------------
// Onboarding shared types + persistence helpers.
//
// The conversion-redesign flow (docs/onboarding-conversion-redesign.md) alternates
// COLLECT and REINFORCE/PREVIEW beats and ends on a soft offer. It is longer and
// AI-laden, so we persist answers + the current step to localStorage after every
// step (incremental persistence, §5.1): an accidental refresh or the LinkedIn
// OAuth round-trip rehydrates without losing progress or re-spending AI calls.
// ---------------------------------------------------------------------------

import type {
    FastIdentity,
    InsightCategory,
    OnboardingInsights,
    RichScrapeStatus,
    RichSummary,
} from '@/types/onboarding'
import type { Tone } from '@/config/ai'
import { obGoalFromStrategy, type Commitment, type ObGoalId, type ObVoiceId } from '@/config/onboarding-flow'
import type { Cadence } from '@/config/onboarding-personalization'
import type { BrandingData, BrandingRole, BrandingWritingStyle } from '@/lib/branding'
import type { ScheduleSlot, StrategyAudience, StrategyData, StrategyFormat, StrategyGoal } from '@/lib/strategy'

// The step machine, single source of truth (StepId derives from it). The audit
// funnel (design import: onboarding/flow) masks the 42-60s rich scrape behind
// the question steps (goal..schedule); building absorbs the tail; reveal is the
// audit payoff right before the plan build and the paywall. 'confirm' is the
// terminal celebration/handoff screen.
export const STEP_ORDER = [
    'welcome',
    'connect',
    'fetching',
    'reassure',
    'goal',
    'persona',
    'recap',
    'proof',
    'voice',
    'topics',
    'schedule',
    'reinforce',
    'building',
    'reveal',
    'email',
    'buildplan',
    'paywall',
    'confirm',
] as const

export type StepId = (typeof STEP_ORDER)[number]

// Pre-v3 blobs come from older step orders. Steps that vanished map to the
// nearest safe step in the new order; question steps that moved map so nothing
// gets skipped (a stale resume must never jump past uncollected answers).
const LEGACY_RESUME: Record<string, StepId> = {
    // v2 machine
    mirror: 'fetching',
    cadence: 'schedule',
    insights: 'reveal',
    preview: 'reveal',
    offer: 'paywall',
    done: 'confirm',
    // v1 machine
    spotlight: 'schedule',
}

const STATE_VERSION = 3

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
    /** Email captured at the earned-value step; binds the anonymous user to a
     *  permanent account without changing user.id. Kept in localStorage answers
     *  for resume prefill only - stripped before the onboarding_sessions upsert (PII). */
    email?: string

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
    /** Whether the fast profile FETCH succeeded (identity came back), regardless of
     *  the inference LLM. Gates the "LinkedIn blocked the request" error card: an
     *  LLM-only failure must fall to the manual form, not blame LinkedIn. */
    mirrorFetchOk?: boolean
    // --- Audit-funnel additions (design import: onboarding/flow) -----------
    /** Extended public identity (Scrapingdog tier) for the Reassure card. */
    identity?: FastIdentity
    /** The goal-deck option picked on screen 04 (maps to primaryGoal/goals/audience). */
    goalId?: ObGoalId
    /** The voice-deck option picked on screen 08 (maps to tone). */
    voiceId?: ObVoiceId
    /** Languages label for the recap sentence ("English & Italian"); editable. */
    language?: string
    /** Free-text correction from the recap's "Something's off?" box; feeds AI prompts. */
    clarification?: string
    /** Commitment answer from the buildplan popup (analytics only). */
    startCommitment?: Commitment
    /** Pillar-tagged posts generated for the paywall preview strip. */
    postIdeas?: { category: InsightCategory; text: string }[]
    /** Only terminal states persist; in-flight generation lives in the buildplan step. */
    postIdeasStatus?: 'ready' | 'failed'

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

    /** The scraped "About" summary; lands in branding.knowledgeBase at finish. */
    aboutSummary?: string

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
        goalId: obGoalFromStrategy(strategy.goals[0])?.id,
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
                LEGACY_RESUME[parsed.resumeAt] ??
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
