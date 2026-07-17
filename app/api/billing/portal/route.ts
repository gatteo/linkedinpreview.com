import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Stripe Customer Portal session
//
// POST -> { url } for the authenticated user's portal (manage/cancel the
// subscription, update the card, download invoices). Only works when the
// billing row carries a Stripe customer id - i.e. the user actually purchased.
// ---------------------------------------------------------------------------

export const maxDuration = 15

export async function POST(request: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
    }
    if (!isStripeConfigured()) {
        return Response.json({ error: 'Billing is not configured', code: 'NOT_CONFIGURED' }, { status: 503 })
    }

    const { data } = await supabase.from('billing').select('stripe_customer_id').maybeSingle()
    const customerId = data?.stripe_customer_id
    if (!customerId) {
        return Response.json({ error: 'No billing account for this user', code: 'NO_CUSTOMER' }, { status: 400 })
    }

    try {
        const origin = new URL(request.url).origin
        const session = await getStripe().billingPortal.sessions.create({
            customer: customerId,
            return_url: `${origin}/dashboard/settings`,
        })
        return Response.json({ url: session.url })
    } catch (err) {
        console.error('[billing/portal] session create failed', err)
        return Response.json({ error: 'Could not open the billing portal', code: 'PORTAL_FAILED' }, { status: 502 })
    }
}
