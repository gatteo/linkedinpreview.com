import Stripe from 'stripe'

import { env } from '@/env.mjs'
import type { CheckoutPlan } from '@/config/pricing'

// ---------------------------------------------------------------------------
// Server-only Stripe client
//
// Billing stays inert when STRIPE_SECRET_KEY is unset (mirrors the LinkedIn
// pattern): isStripeConfigured() gates every call site so checkout/webhook return
// a graceful "not configured" instead of throwing.
// ---------------------------------------------------------------------------

let stripeClient: Stripe | null = null

export function isStripeConfigured(): boolean {
    return !!env.STRIPE_SECRET_KEY
}

export function getStripe(): Stripe {
    if (!env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not set - Stripe billing is not configured')
    }
    if (!stripeClient) {
        stripeClient = new Stripe(env.STRIPE_SECRET_KEY)
    }
    return stripeClient
}

export function priceIdFor(plan: CheckoutPlan): string | null {
    return plan === 'monthly' ? (env.STRIPE_PRICE_MONTHLY ?? null) : (env.STRIPE_PRICE_LIFETIME ?? null)
}
