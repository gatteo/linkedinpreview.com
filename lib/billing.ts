// ---------------------------------------------------------------------------
// Billing / plan model
//
// The plan gates AI volume now (plan-aware rate limits) and, in later waves,
// publishing/scheduling. A single paid entitlement covers both billing shapes:
// `pro` (monthly Stripe subscription) and `lifetime` (one-time payment). Both
// unlock the same power features; AI stays metered on a generous allowance - the
// honest lifetime promise (see docs/onboarding-conversion-redesign.md §7.3).
//
// Written ONLY by the Stripe webhook (service-role client). Clients read their
// own row via RLS. Migration: supabase/migrations/018_billing.sql.
// ---------------------------------------------------------------------------

export type Plan = 'free' | 'pro' | 'lifetime'

export interface BillingData {
    plan: Plan
    /** How the plan was granted, e.g. 'stripe_monthly' | 'stripe_lifetime'. */
    planSource: string | null
    /** ISO timestamp the monthly subscription renews/expires (null for free/lifetime). */
    planRenewsAt: string | null
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
}

export const DEFAULT_BILLING: BillingData = {
    plan: 'free',
    planSource: null,
    planRenewsAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
}

/** A paid plan unlocks power features + higher AI limits. */
export function isPaidPlan(plan: Plan): boolean {
    return plan === 'pro' || plan === 'lifetime'
}
