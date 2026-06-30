import type Stripe from 'stripe'

import { getStripe, isStripeConfigured, priceIdFor } from '@/lib/stripe'
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
    const { plan } = parsed.data

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    const priceId = priceIdFor(plan)
    if (!isStripeConfigured() || !priceId) {
        return Response.json({ error: 'Billing is not configured yet', code: BILLING_NOT_CONFIGURED }, { status: 503 })
    }

    try {
        const params: Stripe.Checkout.SessionCreateParams = {
            // stripe@22 (OpenAPI v2324) renamed the embedded UI mode value to
            // 'embedded_page' (the old 'embedded' is gone). This is the mode that
            // returns a client_secret for Stripe.js embedded checkout.
            ui_mode: 'embedded_page',
            redirect_on_completion: 'never',
            mode: plan === 'monthly' ? 'subscription' : 'payment',
            line_items: [{ price: priceId, quantity: 1 }],
            client_reference_id: user.id,
            metadata: { user_id: user.id, plan },
        }

        if (user.email) params.customer_email = user.email

        if (plan === 'monthly') {
            params.subscription_data = { metadata: { user_id: user.id } }
        } else {
            params.payment_intent_data = { metadata: { user_id: user.id } }
        }

        const session = await getStripe().checkout.sessions.create(params)

        return Response.json({ clientSecret: session.client_secret, sessionId: session.id })
    } catch (err) {
        console.error('[billing/checkout] failed', err)
        return Response.json({ error: 'Failed to create checkout session', code: 'CHECKOUT_FAILED' }, { status: 500 })
    }
}
