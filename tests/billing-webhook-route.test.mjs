import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import Stripe from 'stripe'

import { handleBillingWebhook } from '../lib/billing/webhook-handler.ts'

const WEBHOOK_SECRET = 'whsec_test_billing_route'
const EMAIL_HMAC_KEY = 'test-email-hmac-key'
const USER_ID = '00000000-0000-0000-0000-0000000000a1'

function signedCheckoutEvent(stripe, eventId, sessionId) {
    const body = JSON.stringify({
        id: eventId,
        object: 'event',
        type: 'checkout.session.completed',
        created: 1_725_000_000,
        livemode: false,
        data: { object: { id: sessionId, object: 'checkout.session' } },
    })
    const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret: WEBHOOK_SECRET })
    return { body, signature }
}

test('rejects an oversized declared webhook body before signature parsing', async () => {
    let signatureParserCalled = false
    const response = await handleBillingWebhook(
        new Request('http://localhost/api/billing/webhook', {
            method: 'POST',
            headers: {
                'content-length': String(1024 * 1024 + 1),
                'stripe-signature': 'ignored-because-body-is-too-large',
            },
            body: '{}',
        }),
        {
            isStripeConfigured: true,
            webhookSecret: WEBHOOK_SECRET,
            stripe: {
                webhooks: {
                    constructEvent: () => {
                        signatureParserCalled = true
                        assert.fail('oversized requests must not reach signature parsing')
                    },
                },
                checkout: { sessions: { retrieve: async () => assert.fail('unused') } },
            },
            recordEntitlement: async () => assert.fail('unused'),
            recordSubscriptionLifecycle: async () => assert.fail('unused'),
            priceIds: { monthly: 'price_test_monthly', lifetime: 'price_test_lifetime' },
            emailHmac: { key: EMAIL_HMAC_KEY, keyVersion: 1 },
            captureServer: async () => assert.fail('unused'),
        },
    )

    assert.equal(response.status, 413)
    assert.deepEqual(await response.json(), { error: 'Webhook body too large' })
    assert.equal(signatureParserCalled, false)
})

test('rejects an oversized chunked webhook body before signature parsing', async () => {
    let signatureParserCalled = false
    const encoder = new TextEncoder()
    const oversizedChunk = encoder.encode('x'.repeat(1024 * 1024 + 1))
    const body = new ReadableStream({
        start(controller) {
            controller.enqueue(oversizedChunk)
            controller.close()
        },
    })
    const response = await handleBillingWebhook(
        new Request('http://localhost/api/billing/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': 'ignored-because-body-is-too-large' },
            body,
            duplex: 'half',
        }),
        {
            isStripeConfigured: true,
            webhookSecret: WEBHOOK_SECRET,
            stripe: {
                webhooks: {
                    constructEvent: () => {
                        signatureParserCalled = true
                        assert.fail('oversized requests must not reach signature parsing')
                    },
                },
                checkout: { sessions: { retrieve: async () => assert.fail('unused') } },
            },
            recordEntitlement: async () => assert.fail('unused'),
            recordSubscriptionLifecycle: async () => assert.fail('unused'),
            priceIds: { monthly: 'price_test_monthly', lifetime: 'price_test_lifetime' },
            emailHmac: { key: EMAIL_HMAC_KEY, keyVersion: 1 },
            captureServer: async () => assert.fail('unused'),
        },
    )

    assert.equal(response.status, 413)
    assert.deepEqual(await response.json(), { error: 'Webhook body too large' })
    assert.equal(signatureParserCalled, false)
})

test('records one signed paid lifetime checkout through the immutable ledger', async () => {
    const stripeSdk = new Stripe('webhook-signature-test-key')
    const { body, signature } = signedCheckoutEvent(stripeSdk, 'evt_route_lifetime', 'cs_route_lifetime')
    const rpcCalls = []
    const captures = []

    const response = await handleBillingWebhook(
        new Request('http://localhost/api/billing/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': signature },
            body,
        }),
        {
            isStripeConfigured: true,
            webhookSecret: WEBHOOK_SECRET,
            stripe: {
                webhooks: stripeSdk.webhooks,
                checkout: {
                    sessions: {
                        retrieve: async (id, options) => {
                            assert.equal(id, 'cs_route_lifetime')
                            assert.deepEqual(options, { expand: ['line_items.data.price'] })
                            return {
                                id,
                                payment_status: 'paid',
                                mode: 'payment',
                                amount_total: 3999,
                                currency: 'usd',
                                client_reference_id: USER_ID,
                                metadata: { user_id: USER_ID, plan: 'monthly' },
                                customer: 'cus_route_lifetime',
                                payment_intent: 'pi_route_lifetime',
                                subscription: null,
                                customer_details: { email: 'Buyer@Example.com' },
                                line_items: { data: [{ price: { id: 'price_test_lifetime' } }] },
                            }
                        },
                    },
                },
            },
            recordEntitlement: async (args) => {
                rpcCalls.push(args)
                return {
                    data: [
                        {
                            outcome: 'granted',
                            owner_user_id: USER_ID,
                            plan: 'lifetime',
                            capture_conversion: true,
                        },
                    ],
                    error: null,
                }
            },
            priceIds: { monthly: 'price_test_monthly', lifetime: 'price_test_lifetime' },
            emailHmac: { key: EMAIL_HMAC_KEY, keyVersion: 1 },
            captureServer: async (distinctId, event, properties) => captures.push({ distinctId, event, properties }),
        },
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { received: true })
    assert.equal(rpcCalls.length, 1)
    assert.deepEqual(captures, [
        {
            distinctId: USER_ID,
            event: 'purchase_completed',
            properties: {
                plan: 'lifetime',
                amount_total: 3999,
                currency: 'usd',
                $insert_id: 'checkout:cs_route_lifetime:purchase_completed',
            },
        },
    ])
})

test('records one signed paid asynchronous checkout through the immutable ledger', async () => {
    const stripeSdk = new Stripe('webhook-signature-test-key')
    const body = JSON.stringify({
        id: 'evt_route_async_lifetime',
        object: 'event',
        type: 'checkout.session.async_payment_succeeded',
        created: 1_725_000_001,
        livemode: false,
        data: { object: { id: 'cs_route_async_lifetime', object: 'checkout.session' } },
    })
    const signature = stripeSdk.webhooks.generateTestHeaderString({ payload: body, secret: WEBHOOK_SECRET })
    const rpcCalls = []
    const captures = []

    const response = await handleBillingWebhook(
        new Request('http://localhost/api/billing/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': signature },
            body,
        }),
        {
            isStripeConfigured: true,
            webhookSecret: WEBHOOK_SECRET,
            stripe: {
                webhooks: stripeSdk.webhooks,
                checkout: {
                    sessions: {
                        retrieve: async (id) => ({
                            id,
                            payment_status: 'paid',
                            mode: 'payment',
                            amount_total: 3999,
                            currency: 'usd',
                            client_reference_id: USER_ID,
                            metadata: { user_id: USER_ID },
                            customer: 'cus_route_async_lifetime',
                            payment_intent: 'pi_route_async_lifetime',
                            subscription: null,
                            customer_details: { email: 'buyer@example.com' },
                            line_items: { data: [{ price: { id: 'price_test_lifetime' } }] },
                        }),
                    },
                },
            },
            recordEntitlement: async (args) => {
                rpcCalls.push(args)
                return {
                    data: [{ outcome: 'granted', owner_user_id: USER_ID, plan: 'lifetime', capture_conversion: true }],
                    error: null,
                }
            },
            recordSubscriptionLifecycle: async () => assert.fail('unused'),
            priceIds: { monthly: 'price_test_monthly', lifetime: 'price_test_lifetime' },
            emailHmac: { key: EMAIL_HMAC_KEY, keyVersion: 1 },
            captureServer: async (distinctId, event, properties) => captures.push({ distinctId, event, properties }),
        },
    )

    assert.equal(response.status, 200)
    assert.equal(rpcCalls.length, 1)
    assert.deepEqual(captures, [
        {
            distinctId: USER_ID,
            event: 'purchase_completed',
            properties: {
                plan: 'lifetime',
                amount_total: 3999,
                currency: 'usd',
                $insert_id: 'checkout:cs_route_async_lifetime:purchase_completed',
            },
        },
    ])
})

test('acknowledges a fulfilled checkout when analytics capture fails', async () => {
    const stripeSdk = new Stripe('webhook-signature-test-key')
    const { body, signature } = signedCheckoutEvent(
        stripeSdk,
        'evt_route_analytics_failure',
        'cs_route_analytics_failure',
    )
    let entitlementCalls = 0
    let captureCalls = 0

    const response = await handleBillingWebhook(
        new Request('http://localhost/api/billing/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': signature },
            body,
        }),
        {
            isStripeConfigured: true,
            webhookSecret: WEBHOOK_SECRET,
            stripe: {
                webhooks: stripeSdk.webhooks,
                checkout: {
                    sessions: {
                        retrieve: async (id) => ({
                            id,
                            payment_status: 'paid',
                            mode: 'payment',
                            amount_total: 3999,
                            currency: 'usd',
                            client_reference_id: USER_ID,
                            metadata: { user_id: USER_ID },
                            customer: 'cus_route_analytics_failure',
                            payment_intent: 'pi_route_analytics_failure',
                            subscription: null,
                            customer_details: { email: 'buyer@example.com' },
                            line_items: { data: [{ price: { id: 'price_test_lifetime' } }] },
                        }),
                    },
                },
            },
            recordEntitlement: async () => {
                entitlementCalls += 1
                return {
                    data: [{ outcome: 'granted', owner_user_id: USER_ID, plan: 'lifetime', capture_conversion: true }],
                    error: null,
                }
            },
            priceIds: { monthly: 'price_test_monthly', lifetime: 'price_test_lifetime' },
            emailHmac: { key: EMAIL_HMAC_KEY, keyVersion: 1 },
            captureServer: async () => {
                captureCalls += 1
                throw new Error('PostHog unavailable')
            },
        },
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { received: true })
    assert.equal(entitlementCalls, 1)
    assert.equal(captureCalls, 1)
})

test('acknowledges a signed duplicate Stripe event without another conversion capture', async () => {
    const stripeSdk = new Stripe('webhook-signature-test-key')
    const { body, signature } = signedCheckoutEvent(stripeSdk, 'evt_route_duplicate', 'cs_route_duplicate')
    const captures = []

    const response = await handleBillingWebhook(
        new Request('http://localhost/api/billing/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': signature },
            body,
        }),
        {
            isStripeConfigured: true,
            webhookSecret: WEBHOOK_SECRET,
            stripe: {
                webhooks: stripeSdk.webhooks,
                checkout: {
                    sessions: {
                        retrieve: async (id) => ({
                            id,
                            payment_status: 'paid',
                            mode: 'payment',
                            amount_total: 3999,
                            currency: 'usd',
                            client_reference_id: USER_ID,
                            metadata: { user_id: USER_ID },
                            customer: 'cus_route_duplicate',
                            payment_intent: 'pi_route_duplicate',
                            subscription: null,
                            customer_details: { email: 'buyer@example.com' },
                            line_items: { data: [{ price: { id: 'price_test_lifetime' } }] },
                        }),
                    },
                },
            },
            recordEntitlement: async () => ({
                data: [{ outcome: 'duplicate_event', owner_user_id: null, plan: null, capture_conversion: false }],
                error: null,
            }),
            priceIds: { monthly: 'price_test_monthly', lifetime: 'price_test_lifetime' },
            emailHmac: { key: EMAIL_HMAC_KEY, keyVersion: 1 },
            captureServer: async (distinctId, event, properties) => captures.push({ distinctId, event, properties }),
        },
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { received: true })
    assert.deepEqual(captures, [])
})

test('records one signed paid monthly checkout through the immutable ledger', async () => {
    const stripeSdk = new Stripe('webhook-signature-test-key')
    const { body, signature } = signedCheckoutEvent(stripeSdk, 'evt_route_monthly', 'cs_route_monthly')
    const captures = []

    const response = await handleBillingWebhook(
        new Request('http://localhost/api/billing/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': signature },
            body,
        }),
        {
            isStripeConfigured: true,
            webhookSecret: WEBHOOK_SECRET,
            stripe: {
                webhooks: stripeSdk.webhooks,
                checkout: {
                    sessions: {
                        retrieve: async (id) => ({
                            id,
                            payment_status: 'paid',
                            mode: 'subscription',
                            amount_total: 1199,
                            currency: 'usd',
                            client_reference_id: USER_ID,
                            metadata: { user_id: USER_ID, plan: 'lifetime' },
                            customer: 'cus_route_monthly',
                            payment_intent: null,
                            subscription: 'sub_route_monthly',
                            customer_details: { email: 'buyer@example.com' },
                            line_items: { data: [{ price: { id: 'price_test_monthly' } }] },
                        }),
                    },
                },
            },
            recordEntitlement: async (args) => {
                assert.equal(args.p_plan, 'pro')
                assert.equal(args.p_subscription_id, 'sub_route_monthly')
                return {
                    data: [{ outcome: 'granted', owner_user_id: USER_ID, plan: 'pro', capture_conversion: true }],
                    error: null,
                }
            },
            priceIds: { monthly: 'price_test_monthly', lifetime: 'price_test_lifetime' },
            emailHmac: { key: EMAIL_HMAC_KEY, keyVersion: 1 },
            captureServer: async (distinctId, event, properties) => captures.push({ distinctId, event, properties }),
        },
    )

    assert.equal(response.status, 200)
    assert.deepEqual(captures, [
        {
            distinctId: USER_ID,
            event: 'purchase_completed',
            properties: {
                plan: 'pro',
                amount_total: 1199,
                currency: 'usd',
                $insert_id: 'checkout:cs_route_monthly:purchase_completed',
            },
        },
    ])
})

test('maps a signed non-active subscription update to an immutable inactive lifecycle observation', async () => {
    const stripeSdk = new Stripe('webhook-signature-test-key')
    const body = JSON.stringify({
        id: 'evt_route_subscription_past_due',
        object: 'event',
        type: 'customer.subscription.updated',
        created: 1_725_000_005,
        livemode: false,
        data: { object: { id: 'sub_route_monthly', object: 'subscription', status: 'past_due' } },
    })
    const signature = stripeSdk.webhooks.generateTestHeaderString({ payload: body, secret: WEBHOOK_SECRET })
    const lifecycleCalls = []

    const response = await handleBillingWebhook(
        new Request('http://localhost/api/billing/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': signature },
            body,
        }),
        {
            isStripeConfigured: true,
            webhookSecret: WEBHOOK_SECRET,
            stripe: {
                webhooks: stripeSdk.webhooks,
                checkout: { sessions: { retrieve: async () => assert.fail('unused') } },
            },
            recordEntitlement: async () => assert.fail('checkout ledger must not run for lifecycle events'),
            recordSubscriptionLifecycle: async (args) => {
                lifecycleCalls.push(args)
                return { data: [{ outcome: 'subscription_inactivated' }], error: null }
            },
            priceIds: { monthly: 'price_test_monthly', lifetime: 'price_test_lifetime' },
            emailHmac: { key: EMAIL_HMAC_KEY, keyVersion: 1 },
            captureServer: async () => assert.fail('conversion must not be captured for lifecycle events'),
        },
    )

    assert.equal(response.status, 200)
    assert.deepEqual(lifecycleCalls, [
        {
            p_event_id: 'evt_route_subscription_past_due',
            p_event_type: 'customer.subscription.updated',
            p_stripe_created_at: '2024-08-30T06:40:05.000Z',
            p_payload_digest: createHash('sha256').update(body).digest('hex'),
            p_subscription_id: 'sub_route_monthly',
            p_status: 'inactive',
        },
    ])
})

test('records a signed subscription cancellation through the immutable lifecycle ledger', async () => {
    const stripeSdk = new Stripe('webhook-signature-test-key')
    const body = JSON.stringify({
        id: 'evt_route_subscription_deleted',
        object: 'event',
        type: 'customer.subscription.deleted',
        created: 1_725_000_010,
        livemode: false,
        data: { object: { id: 'sub_route_monthly', object: 'subscription' } },
    })
    const signature = stripeSdk.webhooks.generateTestHeaderString({ payload: body, secret: WEBHOOK_SECRET })
    const lifecycleCalls = []
    const captures = []

    const response = await handleBillingWebhook(
        new Request('http://localhost/api/billing/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': signature },
            body,
        }),
        {
            isStripeConfigured: true,
            webhookSecret: WEBHOOK_SECRET,
            stripe: {
                webhooks: stripeSdk.webhooks,
                checkout: { sessions: { retrieve: async () => assert.fail('unused') } },
            },
            recordEntitlement: async () => assert.fail('checkout ledger must not run for lifecycle events'),
            recordSubscriptionLifecycle: async (args) => {
                lifecycleCalls.push(args)
                return { data: [{ outcome: 'subscription_inactivated' }], error: null }
            },
            priceIds: { monthly: 'price_test_monthly', lifetime: 'price_test_lifetime' },
            emailHmac: { key: EMAIL_HMAC_KEY, keyVersion: 1 },
            captureServer: async (distinctId, event, properties) => captures.push({ distinctId, event, properties }),
        },
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { received: true })
    assert.deepEqual(lifecycleCalls, [
        {
            p_event_id: 'evt_route_subscription_deleted',
            p_event_type: 'customer.subscription.deleted',
            p_stripe_created_at: '2024-08-30T06:40:10.000Z',
            p_payload_digest: createHash('sha256').update(body).digest('hex'),
            p_subscription_id: 'sub_route_monthly',
            p_status: 'inactive',
        },
    ])
    assert.deepEqual(captures, [])
})

test('acknowledges a signed unrelated Stripe event without mutating billing', async () => {
    const stripeSdk = new Stripe('webhook-signature-test-key')
    const body = JSON.stringify({
        id: 'evt_route_unrelated',
        object: 'event',
        type: 'payment_intent.succeeded',
        created: 1_725_000_020,
        livemode: false,
        data: { object: { id: 'pi_unrelated', object: 'payment_intent' } },
    })
    const signature = stripeSdk.webhooks.generateTestHeaderString({ payload: body, secret: WEBHOOK_SECRET })
    const response = await handleBillingWebhook(
        new Request('http://localhost/api/billing/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': signature },
            body,
        }),
        {
            isStripeConfigured: true,
            webhookSecret: WEBHOOK_SECRET,
            stripe: {
                webhooks: stripeSdk.webhooks,
                checkout: { sessions: { retrieve: async () => assert.fail('unused') } },
            },
            recordEntitlement: async () => assert.fail('checkout ledger must not run for unrelated events'),
            recordSubscriptionLifecycle: async () => assert.fail('lifecycle ledger must not run for unrelated events'),
            priceIds: { monthly: 'price_test_monthly', lifetime: 'price_test_lifetime' },
            emailHmac: { key: EMAIL_HMAC_KEY, keyVersion: 1 },
            captureServer: async () => assert.fail('conversion must not be captured for unrelated events'),
        },
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { received: true })
})
