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

/** The env vars billing needs to run checkout end to end. Single source of truth. */
export const STRIPE_ENV_VARS = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_MONTHLY',
    'STRIPE_PRICE_LIFETIME',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
] as const

/** Which billing env vars are unset. Empty when fully configured. */
export function missingStripeEnv(): string[] {
    return STRIPE_ENV_VARS.filter((name) => !env[name])
}

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
