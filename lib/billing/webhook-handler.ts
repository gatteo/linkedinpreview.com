import { createHash } from 'node:crypto'

import { recordSignedCheckoutEntitlement, type CanonicalCheckoutSession } from './entitlement-ingress.ts'

interface StripeEvent {
    id: string
    type: string
    created: number
    data: { object: { id: string; status?: string } }
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

interface SubscriptionLifecycleRecord {
    outcome: 'subscription_activated' | 'subscription_inactivated' | 'subscription_stale' | 'duplicate_event'
}

const MAX_STRIPE_WEBHOOK_BODY_BYTES = 1024 * 1024

class WebhookBodyTooLargeError extends Error {}

async function readWebhookBody(request: Request): Promise<string> {
    const declaredLength = request.headers.get('content-length')
    if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > MAX_STRIPE_WEBHOOK_BODY_BYTES) {
        throw new WebhookBodyTooLargeError()
    }

    if (!request.body) return ''

    const reader = request.body.getReader()
    const chunks: Uint8Array[] = []
    let totalBytes = 0
    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            totalBytes += value.byteLength
            if (totalBytes > MAX_STRIPE_WEBHOOK_BODY_BYTES) {
                await reader.cancel()
                throw new WebhookBodyTooLargeError()
            }
            chunks.push(value)
        }
    } finally {
        reader.releaseLock()
    }

    const body = new Uint8Array(totalBytes)
    let offset = 0
    for (const chunk of chunks) {
        body.set(chunk, offset)
        offset += chunk.byteLength
    }
    return new TextDecoder().decode(body)
}

export interface BillingWebhookDependencies {
    isStripeConfigured: boolean
    webhookSecret: string | null | undefined
    stripe: StripeWebhookClient
    recordEntitlement: (
        args: Record<string, unknown>,
    ) => Promise<{ data: EntitlementRecord[] | null; error: Error | null }>
    recordSubscriptionLifecycle: (
        args: Record<string, unknown>,
    ) => Promise<{ data: SubscriptionLifecycleRecord[] | null; error: Error | null }>
    priceIds: { monthly: string; lifetime: string }
    emailHmac: { key: string; keyVersion: number }
    captureServer: (distinctId: string, event: string, properties: Record<string, unknown>) => Promise<void>
}

export async function handleBillingWebhook(
    request: Request,
    dependencies: BillingWebhookDependencies,
): Promise<Response> {
    let body: string
    try {
        body = await readWebhookBody(request)
    } catch (error) {
        if (error instanceof WebhookBodyTooLargeError) {
            return Response.json({ error: 'Webhook body too large' }, { status: 413 })
        }
        console.error('[billing/webhook] raw body read failed', error)
        return Response.json({ error: 'Invalid webhook body' }, { status: 400 })
    }
    const signature = request.headers.get('stripe-signature')

    if (!dependencies.webhookSecret || !dependencies.isStripeConfigured) {
        return Response.json({ received: true, skipped: true })
    }

    if (!signature) {
        return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    let event: StripeEvent
    try {
        event = dependencies.stripe.webhooks.constructEvent(body, signature, dependencies.webhookSecret)
    } catch {
        return Response.json({ error: 'Invalid signature' }, { status: 400 })
    }

    try {
        if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const status = event.type === 'customer.subscription.deleted' ? 'inactive' : event.data.object.status
            const lifecycleStatus = status === 'active' || status === 'trialing' ? 'active' : 'inactive'
            const { data, error } = await dependencies.recordSubscriptionLifecycle({
                p_event_id: event.id,
                p_event_type: event.type,
                p_stripe_created_at: new Date(event.created * 1000).toISOString(),
                p_payload_digest: createHash('sha256').update(body).digest('hex'),
                p_subscription_id: event.data.object.id,
                p_status: lifecycleStatus,
            })
            const outcome = data?.[0]?.outcome
            if (
                error ||
                ![
                    'subscription_activated',
                    'subscription_inactivated',
                    'subscription_stale',
                    'duplicate_event',
                ].includes(outcome ?? '')
            ) {
                throw error ?? new Error('Invalid subscription lifecycle result')
            }
        } else if (
            event.type === 'checkout.session.completed' ||
            event.type === 'checkout.session.async_payment_succeeded'
        ) {
            const result = await recordSignedCheckoutEntitlement({
                body,
                signature,
                webhookSecret: dependencies.webhookSecret,
                stripe: dependencies.stripe,
                recordEntitlement: dependencies.recordEntitlement,
                priceIds: dependencies.priceIds,
                emailHmac: dependencies.emailHmac,
            })

            if (result.outcome === 'granted' && result.captureConversion) {
                try {
                    await dependencies.captureServer(result.userId, 'purchase_completed', {
                        plan: result.plan,
                        amount_total: result.amountTotal,
                        currency: result.currency,
                        $insert_id: `checkout:${result.checkoutSessionId}:purchase_completed`,
                    })
                } catch (error) {
                    console.error('[billing/webhook] analytics capture failed after entitlement fulfillment', error)
                }
            }
        }
    } catch (error) {
        console.error('[billing/webhook] immutable checkout handler failed', error)
        return Response.json({ error: 'Handler failed' }, { status: 500 })
    }

    return Response.json({ received: true })
}
