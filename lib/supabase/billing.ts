import type { SupabaseClient } from '@supabase/supabase-js'

import { DEFAULT_BILLING, type BillingData, type Plan } from '@/lib/billing'

// ---------------------------------------------------------------------------
// Billing persistence
//
// Reads happen via the user's RLS-scoped client (own row only). Writes happen via
// the service-role admin client from the Stripe webhook - the single source of
// truth for plan state. Snake_case columns map to BillingData camelCase here.
// ---------------------------------------------------------------------------

interface BillingPatch {
    plan?: Plan
    planSource?: string | null
    planRenewsAt?: string | null
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
}

/**
 * Fetch billing for the current user. Returns DEFAULT_BILLING when no row exists.
 */
export async function fetchBilling(client: SupabaseClient): Promise<BillingData> {
    const { data, error } = await client
        .from('billing')
        .select('plan, plan_source, plan_renews_at, stripe_customer_id, stripe_subscription_id')
        .maybeSingle()

    if (error) {
        if (error.code === 'PGRST116') return DEFAULT_BILLING // no row yet
        throw error
    }

    if (!data) return DEFAULT_BILLING

    return {
        plan: (data.plan ?? 'free') as Plan,
        planSource: data.plan_source ?? null,
        planRenewsAt: data.plan_renews_at ?? null,
        stripeCustomerId: data.stripe_customer_id ?? null,
        stripeSubscriptionId: data.stripe_subscription_id ?? null,
    }
}

/**
 * Upsert the billing row. Writes only the snake_case columns present in `patch`
 * (null is a meaningful value - e.g. clearing planSource on downgrade - so the
 * presence check is `!== undefined`, not truthiness).
 */
export async function upsertBillingPlan(admin: SupabaseClient, userId: string, patch: BillingPatch): Promise<void> {
    const row: Record<string, unknown> = {
        user_id: userId,
        updated_at: new Date().toISOString(),
    }

    if (patch.plan !== undefined) row.plan = patch.plan
    if (patch.planSource !== undefined) row.plan_source = patch.planSource
    if (patch.planRenewsAt !== undefined) row.plan_renews_at = patch.planRenewsAt
    if (patch.stripeCustomerId !== undefined) row.stripe_customer_id = patch.stripeCustomerId
    if (patch.stripeSubscriptionId !== undefined) row.stripe_subscription_id = patch.stripeSubscriptionId

    const { error } = await admin.from('billing').upsert(row, { onConflict: 'user_id' })
    if (error) throw error
}

/**
 * Resolve the owning user from a Stripe customer id (webhook fallback when the
 * event carries no user_id metadata).
 */
export async function findUserIdByStripeCustomer(admin: SupabaseClient, customerId: string): Promise<string | null> {
    const { data, error } = await admin
        .from('billing')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

    if (error) {
        if (error.code === 'PGRST116') return null
        throw error
    }

    return data?.user_id ?? null
}
