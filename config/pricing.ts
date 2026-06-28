// ---------------------------------------------------------------------------
// Pricing + offer config
//
// Drives the onboarding offer screen (§7) and the upgrade surfaces. Several
// values are PLACEHOLDERs that MUST be confirmed/swapped before public launch
// (guardrail §1.5, inventory §9). Stripe Price IDs live in env (server-only);
// these are display/economics constants only.
// ---------------------------------------------------------------------------

import type { Plan } from '@/lib/billing'

/** The two purchasable options on the offer screen. */
export type CheckoutPlan = 'monthly' | 'lifetime'

export const PRICING = {
    monthly: {
        amount: 7.99,
        display: '$7.99',
        currency: 'usd',
        interval: 'month' as const,
    },
    lifetime: {
        amount: 29.99,
        display: '$29.99',
        currency: 'usd',
    },
}

/**
 * Founding window. Honest urgency only (guardrail §1.5): this date must map to a
 * real, enforced window. After it passes, the offer hides the countdown line.
 * PLACEHOLDER - confirm a real founding end date before public launch.
 */
export const FOUNDING_WINDOW_END = '2026-07-31T23:59:59Z'

export function isFoundingWindowOpen(now: Date = new Date()): boolean {
    return now.getTime() < new Date(FOUNDING_WINDOW_END).getTime()
}

export function foundingDaysLeft(now: Date = new Date()): number {
    const ms = new Date(FOUNDING_WINDOW_END).getTime() - now.getTime()
    return Math.max(0, Math.ceil(ms / 86_400_000))
}

/** PLACEHOLDER - confirm the real refund policy before launch. */
export const MONEY_BACK_DAYS = 7

/** Re-verify before any public quote (accurate in the June 2026 competitor scan). */
export const COMPETITOR_PRICE_RANGE = '$39-199/mo'

/** Honesty line shown on the lifetime card (§7.3): AI is not unlimited forever. */
export const AI_METERED_NOTE = 'AI generation stays on a generous monthly limit'

export const PLAN_LABELS: Record<Plan, string> = {
    free: 'Free',
    pro: 'Pro',
    lifetime: 'Lifetime',
}
