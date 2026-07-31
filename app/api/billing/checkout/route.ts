import type Stripe from 'stripe'

import { ENTRY_PARAM } from '@/config/entry-sources'
import { CHECKOUT_UI } from '@/config/pricing'
import { devMissingEnv } from '@/lib/dev/missing-env'
import { getStripe, isStripeConfigured, missingStripeEnv, priceIdFor } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

import { bodySchema } from './route.schema'

export const runtime = 'nodejs'
export const maxDuration = 30

const BILLING_NOT_CONFIGURED = 'BILLING_NOT_CONFIGURED'

export async function POST(request: Request) {
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return Response.json({ error: 'Invalid JSON body', code: 'INVALID_INPUT' }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
        return Response.json({ error: 'Invalid plan', code: 'INVALID_INPUT' }, { status: 400 })
    }
    const { plan, source } = parsed.data

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    const priceId = priceIdFor(plan)
    if (!isStripeConfigured() || !priceId) {
        return Response.json(
            {
                error: 'Billing is not configured yet',
                code: BILLING_NOT_CONFIGURED,
                ...devMissingEnv(missingStripeEnv()),
            },
            { status: 503 },
        )
    }

    try {
        const params: Stripe.Checkout.SessionCreateParams = {
            mode: plan === 'monthly' ? 'subscription' : 'payment',
            line_items: [{ price: priceId, quantity: 1 }],
            client_reference_id: user.id,
            metadata: { user_id: user.id, plan },
            // Without this Stripe renders no promotion-code field at all, so any
            // coupon we issue is unredeemable.
            allow_promotion_codes: true,
        }

        if (CHECKOUT_UI === 'hosted') {
            // Full-page hosted checkout: Stripe redirects back to the dashboard
            // where the initiating surface (source) resumes via the query params.
            const origin = new URL(request.url).origin
            params.ui_mode = 'hosted_page'
            params.success_url = `${origin}/dashboard?checkout=success&plan=${plan}&source=${source}&${ENTRY_PARAM}=billing_return&session_id={CHECKOUT_SESSION_ID}`
            params.cancel_url = `${origin}/dashboard?checkout=cancelled&plan=${plan}&source=${source}&${ENTRY_PARAM}=billing_return`
        } else {
            // stripe@22 (OpenAPI v2324) renamed the embedded UI mode value to
            // 'embedded_page' (the old 'embedded' is gone). This is the mode that
            // returns a client_secret for Stripe.js embedded checkout.
            params.ui_mode = 'embedded_page'
            params.redirect_on_completion = 'never'
        }

        if (user.email) params.customer_email = user.email

        if (plan === 'monthly') {
            params.subscription_data = { metadata: { user_id: user.id } }
        } else {
            params.payment_intent_data = { metadata: { user_id: user.id } }
        }

        const session = await getStripe().checkout.sessions.create(params)

        if (CHECKOUT_UI === 'hosted') {
            return Response.json({ url: session.url, sessionId: session.id })
        }
        return Response.json({ clientSecret: session.client_secret, sessionId: session.id })
    } catch (err) {
        console.error('[billing/checkout] failed', err)
        return Response.json({ error: 'Failed to create checkout session', code: 'CHECKOUT_FAILED' }, { status: 500 })
    }
}
