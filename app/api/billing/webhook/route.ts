import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

import { env } from '@/env.mjs'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { findUserIdByStripeCustomer, upsertBillingPlan } from '@/lib/supabase/billing'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renewal timestamp for a subscription. In recent Stripe API versions
 * `current_period_end` moved from the subscription onto the subscription item, so
 * we read the top-level field first then fall back to the first item. Unix seconds.
 */
function periodEndIso(sub: Stripe.Subscription): string | null {
    const epoch =
        (sub as unknown as { current_period_end?: number }).current_period_end ??
        sub.items?.data?.[0]?.current_period_end ??
        null
    return typeof epoch === 'number' ? new Date(epoch * 1000).toISOString() : null
}

async function resolveUserId(admin: SupabaseClient, sub: Stripe.Subscription): Promise<string | null> {
    if (sub.metadata?.user_id) return sub.metadata.user_id
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
    if (!customerId) return null
    return findUserIdByStripeCustomer(admin, customerId)
}

/**
 * Downgrade to free, but never touch a lifetime purchaser: a lapsed/canceled
 * subscription must not revoke a one-time lifetime entitlement.
 */
async function downgradeToFree(admin: SupabaseClient, userId: string): Promise<void> {
    const { data } = await admin.from('billing').select('plan, plan_source').eq('user_id', userId).maybeSingle()
    if (data?.plan === 'lifetime' || data?.plan_source === 'stripe_lifetime') return

    await upsertBillingPlan(admin, userId, { plan: 'free', planSource: null, planRenewsAt: null })
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    // Inert when unconfigured - acknowledge without acting.
    if (!env.STRIPE_WEBHOOK_SECRET || !isStripeConfigured()) {
        return Response.json({ received: true, skipped: true })
    }

    if (!sig) {
        return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
        event = getStripe().webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
        console.error('[billing/webhook] signature verification failed', err)
        return Response.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const admin = createAdminClient()

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const s = event.data.object
                const userId = s.metadata?.user_id ?? s.client_reference_id
                if (!userId) break

                const customerId = typeof s.customer === 'string' ? s.customer : null

                if (s.mode === 'payment') {
                    await upsertBillingPlan(admin, userId, {
                        plan: 'lifetime',
                        planSource: 'stripe_lifetime',
                        stripeCustomerId: customerId,
                    })
                } else if (s.mode === 'subscription' && s.subscription) {
                    const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription.id
                    const sub = await getStripe().subscriptions.retrieve(subId)
                    await upsertBillingPlan(admin, userId, {
                        plan: 'pro',
                        planSource: 'stripe_monthly',
                        stripeCustomerId: customerId,
                        stripeSubscriptionId: sub.id,
                        planRenewsAt: periodEndIso(sub),
                    })
                }
                break
            }

            case 'customer.subscription.updated': {
                const evtSub = event.data.object
                const userId = await resolveUserId(admin, evtSub)
                if (!userId) break

                // Stripe does not guarantee event ordering, so a stale/duplicate
                // 'active' update must not resurrect a canceled subscription.
                // Re-retrieve the authoritative current status before writing.
                let sub: Stripe.Subscription = evtSub
                try {
                    sub = await getStripe().subscriptions.retrieve(evtSub.id)
                } catch {
                    // Fall back to the event payload if the lookup fails.
                }

                if (sub.status === 'active' || sub.status === 'trialing') {
                    await upsertBillingPlan(admin, userId, {
                        plan: 'pro',
                        stripeSubscriptionId: sub.id,
                        planRenewsAt: periodEndIso(sub),
                    })
                } else {
                    await downgradeToFree(admin, userId)
                }
                break
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object
                const userId = await resolveUserId(admin, sub)
                if (!userId) break
                await downgradeToFree(admin, userId)
                break
            }

            default:
                break
        }
    } catch (err) {
        // Non-signature handler errors: log but still 200 so Stripe does not retry forever.
        console.error('[billing/webhook] handler error', event.type, err)
    }

    return Response.json({ received: true })
}
