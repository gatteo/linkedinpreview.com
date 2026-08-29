// ---------------------------------------------------------------------------
// Pricing + offer config
//
// Drives the onboarding offer screen (§7) and the upgrade surfaces. Stripe Price
// IDs live in env (server-only); these are display/economics constants only.
// ---------------------------------------------------------------------------

import type { Plan } from '@/lib/billing'

/** The two purchasable options on the offer screen. */
export type CheckoutPlan = 'monthly' | 'lifetime'

/**
 * Which Stripe Checkout UI the purchase surfaces use.
 * - 'hosted': full-page redirect to Stripe's hosted checkout, returns to
 *   /dashboard?checkout=success|cancelled (webhook still flips the plan)
 * - 'embedded': Stripe embedded checkout rendered inside the modal
 * One flip here switches the API route and both purchase surfaces together.
 */
export const CHECKOUT_UI: 'hosted' | 'embedded' = 'hosted'

export const PRICING = {
    monthly: {
        amount: 11.99,
        display: '$11.99',
        currency: 'usd',
        interval: 'month' as const,
    },
    lifetime: {
        amount: 39.99,
        display: '$39.99',
        currency: 'usd',
    },
}

/** Note shown on the lifetime card (§7.3): AI generation is metered monthly. */
export const AI_METERED_NOTE = 'AI generation stays on a generous monthly limit'

export const PLAN_LABELS: Record<Plan, string> = {
    free: 'Free',
    pro: 'Pro',
    lifetime: 'Lifetime',
}
