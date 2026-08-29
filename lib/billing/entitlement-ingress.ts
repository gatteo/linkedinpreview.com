import { createHash, createHmac } from 'node:crypto'

export interface CanonicalCheckoutSession {
    id: string
    payment_status: string | null
    mode: string | null
    client_reference_id: string | null
    metadata: Record<string, string> | null
    customer: string | { id: string } | null
    payment_intent: string | { id: string } | null
    subscription: string | { id: string } | null
    customer_details: { email: string | null } | null
    line_items: { data: Array<{ price: { id: string } | null }> } | null
}

interface StripeEvent {
    id: string
    type: string
    created: number
    data: { object: { id: string } }
}

interface StripeWebhookClient {
    webhooks: { constructEvent(body: string, signature: string, secret: string): StripeEvent }
    checkout: {
        sessions: {
            retrieve(id: string, options: { expand: string[] }): Promise<CanonicalCheckoutSession>
        }
    }
}

interface EntitlementRecord {
    outcome: 'granted' | 'existing_session' | 'duplicate_event'
    owner_user_id: string | null
    plan: 'pro' | 'lifetime' | null
    capture_conversion: boolean
}

interface EntitlementIngressArgs {
    body: string
    signature: string
    webhookSecret: string
    stripe: StripeWebhookClient
    recordEntitlement: (
        args: Record<string, unknown>,
    ) => Promise<{ data: EntitlementRecord[] | null; error: Error | null }>
    priceIds: { monthly: string; lifetime: string }
    emailHmac: { key: string; keyVersion: number }
}

export interface EntitlementIngressResult {
    handled: true
    userId: string
    plan: 'pro' | 'lifetime'
    captureConversion: boolean
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function stripeId(value: string | { id: string } | null): string | null {
    if (typeof value === 'string') return value
    return value?.id ?? null
}

function userIdFor(session: CanonicalCheckoutSession): string {
    const clientReferenceId = session.client_reference_id
    const metadataUserId = session.metadata?.user_id
    if (
        !clientReferenceId ||
        !metadataUserId ||
        clientReferenceId !== metadataUserId ||
        !UUID.test(clientReferenceId)
    ) {
        throw new Error('Checkout session ownership is missing or inconsistent')
    }
    return clientReferenceId
}

function planFor(session: CanonicalCheckoutSession, priceIds: EntitlementIngressArgs['priceIds']): 'pro' | 'lifetime' {
    const items = session.line_items?.data ?? []
    if (items.length !== 1) throw new Error('Checkout session must contain exactly one line item')

    const priceId = items[0]?.price?.id
    if (priceId === priceIds.monthly && session.mode === 'subscription') return 'pro'
    if (priceId === priceIds.lifetime && session.mode === 'payment') return 'lifetime'
    throw new Error('Checkout session price or mode is not eligible for an entitlement')
}

function emailHmacFor(session: CanonicalCheckoutSession, emailHmac: EntitlementIngressArgs['emailHmac']): string {
    const email = session.customer_details?.email?.normalize('NFKC').trim().toLowerCase()
    if (!email) throw new Error('Checkout session is missing a customer email')
    return createHmac('sha256', emailHmac.key).update(email).digest('hex')
}

/**
 * Verifies a raw Stripe event, retrieves its canonical Checkout Session, then calls
 * the immutable session-ledger RPC. It intentionally derives no entitlement data
 * from unsigned event metadata.
 */
export async function recordSignedCheckoutEntitlement({
    body,
    signature,
    webhookSecret,
    stripe,
    recordEntitlement,
    priceIds,
    emailHmac,
}: EntitlementIngressArgs): Promise<EntitlementIngressResult> {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    if (event.type !== 'checkout.session.completed') {
        throw new Error(`Unsupported Stripe event: ${event.type}`)
    }

    const session = await stripe.checkout.sessions.retrieve(event.data.object.id, { expand: ['line_items.data.price'] })
    if (session.payment_status !== 'paid') throw new Error('Checkout session is not paid')

    const userId = userIdFor(session)
    const plan = planFor(session, priceIds)
    const paymentIntentId = stripeId(session.payment_intent)
    const subscriptionId = stripeId(session.subscription)
    const customerId = stripeId(session.customer)

    if (!customerId || (plan === 'lifetime' && !paymentIntentId) || (plan === 'pro' && !subscriptionId)) {
        throw new Error('Checkout session is missing a required Stripe payment reference')
    }

    const { data, error } = await recordEntitlement({
        p_event_id: event.id,
        p_event_type: event.type,
        p_stripe_created_at: new Date(event.created * 1000).toISOString(),
        p_payload_digest: createHash('sha256').update(body).digest('hex'),
        p_checkout_session_id: session.id,
        p_origin_user_id: userId,
        p_plan: plan,
        p_status: 'active',
        p_payment_intent_id: paymentIntentId,
        p_subscription_id: subscriptionId,
        p_customer_id: customerId,
        p_checkout_email_hmac: emailHmacFor(session, emailHmac),
        p_checkout_email_hmac_key_version: emailHmac.keyVersion,
    })

    if (error) throw error
    const outcome = data?.[0]
    if (!outcome?.owner_user_id || outcome.plan !== plan) throw new Error('Entitlement RPC returned an invalid result')

    return {
        handled: true,
        userId: outcome.owner_user_id,
        plan,
        captureConversion: outcome.capture_conversion,
    }
}
