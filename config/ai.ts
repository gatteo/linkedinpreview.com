import type { Plan } from '@/lib/billing'

// Free-plan daily AI limits (24h rolling window, per action). The onboarding
// buckets (onbEnrich/onbFirstPost) are one-time and intentionally generous so the
// "aha" moment is never gated (see onboarding-conversion-redesign.md §4.3).
export const AI_RATE_LIMITS = {
    generation: 1,
    refinement: 3,
    analysis: 20,
    wizard: 5,
    quickAction: 10,
    ideas: 3,
    insights: 5,
    import: 10,
    carouselGenerate: 3,
    onbEnrich: 5,
    onbFirstPost: 15,
} as const

export type AiAction = keyof typeof AI_RATE_LIMITS

// Paid plans (pro + lifetime) get a high fair-use ceiling rather than truly
// unlimited - honest with the lifetime "AI stays metered" promise (§7.3).
export const PRO_AI_RATE_LIMITS: Record<AiAction, number> = {
    generation: 50,
    refinement: 200,
    analysis: 200,
    wizard: 100,
    quickAction: 300,
    ideas: 50,
    insights: 50,
    import: 50,
    carouselGenerate: 50,
    onbEnrich: 5,
    onbFirstPost: 15,
}

/** Per-action daily limits for the given plan. */
export function aiLimitsForPlan(plan: Plan): Record<AiAction, number> {
    return plan === 'free' ? AI_RATE_LIMITS : PRO_AI_RATE_LIMITS
}

/** Default model id when LLM_MODEL is unset. Shared by all AI routes. */
export const DEFAULT_LLM_MODEL = 'gpt-4o-mini'

export const AI_ERROR_CODES = {
    RATE_LIMITED: 'RATE_LIMITED',
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    INVALID_INPUT: 'INVALID_INPUT',
    GENERATION_FAILED: 'GENERATION_FAILED',
} as const

export type Tone = 'professional' | 'casual' | 'inspirational' | 'educational' | 'storytelling' | 'humorous'

export const TONE_OPTIONS: { value: Tone; label: string }[] = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'inspirational', label: 'Inspirational' },
    { value: 'educational', label: 'Educational' },
    { value: 'storytelling', label: 'Storytelling' },
    { value: 'humorous', label: 'Humorous' },
]
