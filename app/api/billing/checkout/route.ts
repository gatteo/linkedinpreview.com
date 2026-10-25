import type Stripe from 'stripe'

import { ENTRY_PARAM } from '@/config/entry-sources'
import { CHECKOUT_UI } from '@/config/pricing'
import { devMissingEnv } from '@/lib/dev/missing-env'
import { DRAFT_FIRST_VERSION } from '@/lib/draft-first'
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
    const {
        plan,
        source,
        entrySource,
        exposureId,
        eligibilityAt,
        cohortId,
        assignedVariant,
        offerVersion,
        monthlyOffer,
        jobOffer,
    } = parsed.data

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    const priceId = priceIdFor(plan)
    if (jobOffer) {
        if (jobOffer.userId !== user.id || CHECKOUT_UI !== 'hosted') {
            return Response.json({ code: 'JOB_OFFER_UNAVAILABLE' }, { status: 409 })
        }
        try {
            const { readVisitorWritingPlan } = await import('@/lib/visitor-writing')
            const plan = await readVisitorWritingPlan(supabase, user.id)
            if (plan !== 'free') return Response.json({ code: 'JOB_OFFER_UNAVAILABLE' }, { status: 409 })
        } catch {
            return Response.json({ code: 'BILLING_UNRESOLVED' }, { status: 503 })
        }
    }
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
            metadata: {
                user_id: user.id,
                plan,
                entry_source: entrySource,
                ...(jobOffer
                    ? {
                          job_enrollment_id: jobOffer.enrollmentId,
                          job_eligibility_at: jobOffer.eligibilityAt,
                          job_flow_version: jobOffer.version,
                          job_source: 'public_post_copy',
                          job: 'writing_help',
                          historical_overlap: jobOffer.historicalOverlap,
                          billing_state_at_assignment: 'free',
                          release_sha: jobOffer.releaseSha,
                      }
                    : {}),
                ...(exposureId ? { exposure_id: exposureId, activation_version: DRAFT_FIRST_VERSION } : {}),
                ...(exposureId && cohortId
                    ? {
                          enrollment_id: exposureId,
                          cohort_id: cohortId,
                          assigned_variant: assignedVariant ?? 'draft_first',
                          assignment_version: DRAFT_FIRST_VERSION,
                          ...(eligibilityAt ? { eligibility_at: eligibilityAt } : {}),
                          offer_version: offerVersion ?? 'existing_offer',
                      }
                    : {}),
                ...(exposureId && cohortId
                    ? {
                          draft_enrollment_id: exposureId,
                          draft_cohort_id: cohortId,
                          draft_assigned_variant: assignedVariant ?? 'draft_first',
                          draft_assignment_version: DRAFT_FIRST_VERSION,
                          ...(eligibilityAt ? { draft_eligibility_at: eligibilityAt } : {}),
                          draft_offer_version: offerVersion ?? 'existing_offer',
                          draft_entry_source: entrySource,
                      }
                    : {}),
                ...(monthlyOffer
                    ? {
                          enrollment_id: monthlyOffer.enrollmentId,
                          cohort_id: monthlyOffer.cohortId,
                          assigned_variant: monthlyOffer.assignedVariant,
                          eligibility_at: monthlyOffer.eligibilityAt,
                          assignment_version: monthlyOffer.offerVersion,
                          offer_version: monthlyOffer.offerVersion,
                          entry_source: exposureId ? entrySource : monthlyOffer.entrySource,
                          monthly_entry_source: monthlyOffer.entrySource,
                          billing_state_at_assignment: monthlyOffer.billingState,
                          release_sha: monthlyOffer.releaseSha,
                      }
                    : {}),
            },
            // Without this Stripe renders no promotion-code field at all, so any
            // coupon we issue is unredeemable.
            allow_promotion_codes: true,
        }

        if (CHECKOUT_UI === 'hosted') {
            // Full-page hosted checkout: Stripe redirects back to the dashboard
            // where the initiating surface (source) resumes via the query params.
            const origin = new URL(request.url).origin
            params.ui_mode = 'hosted_page'
            const attribution = `&entry_source=${exposureId ? entrySource : (monthlyOffer?.entrySource ?? entrySource)}${exposureId ? `&activation=${exposureId}` : ''}${monthlyOffer ? `&offer_enrollment=${monthlyOffer.enrollmentId}` : ''}`
            params.success_url = `${origin}/dashboard?checkout=success&plan=${plan}&source=${source}&${ENTRY_PARAM}=billing_return${attribution}&session_id={CHECKOUT_SESSION_ID}`
            params.cancel_url = `${origin}/dashboard?checkout=cancelled&plan=${plan}&source=${source}&${ENTRY_PARAM}=billing_return${attribution}`
            if (jobOffer) {
                const attribution = `&job_enrollment=${jobOffer.enrollmentId}`
                params.success_url = `${origin}/?checkout=success&plan=${plan}&source=visitor_job${attribution}&session_id={CHECKOUT_SESSION_ID}#tool`
                params.cancel_url = `${origin}/?checkout=cancelled&plan=${plan}&source=visitor_job${attribution}#tool`
            }
        } else {
            // stripe@22 (OpenAPI v2324) renamed the embedded UI mode value to
            // 'embedded_page' (the old 'embedded' is gone). This is the mode that
            // returns a client_secret for Stripe.js embedded checkout.
            params.ui_mode = 'embedded_page'
            params.redirect_on_completion = 'never'
        }

        if (user.email) params.customer_email = user.email

        if (plan === 'monthly') {
            params.subscription_data = { metadata: { ...params.metadata, user_id: user.id } }
        } else {
            params.payment_intent_data = { metadata: { ...params.metadata, user_id: user.id } }
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
