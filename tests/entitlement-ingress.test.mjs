import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import test from 'node:test'
import Stripe from 'stripe'

import { recordSignedCheckoutEntitlement } from '../lib/billing/entitlement-ingress.ts'

const WEBHOOK_SECRET = 'whsec_test_entitlement_ingress'
const EMAIL_HMAC_KEY = 'test-email-hmac-key'
const USER_ID = '00000000-0000-0000-0000-0000000000a1'

function signedCheckoutEvent(stripe, eventId, sessionId) {
    const payload = JSON.stringify({
        id: eventId,
        object: 'event',
        type: 'checkout.session.completed',
        created: 1_725_000_000,
        livemode: false,
        data: { object: { id: sessionId, object: 'checkout.session' } },
    })
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET })
    return { payload, signature }
}

test('records a signed paid lifetime checkout using canonical Stripe session data', async () => {
    const stripe = new Stripe('webhook-signature-test-key')
    const { payload, signature } = signedCheckoutEvent(stripe, 'evt_test_lifetime', 'cs_test_lifetime')
    const rpcCalls = []

    const result = await recordSignedCheckoutEntitlement({
        body: payload,
        signature,
        webhookSecret: WEBHOOK_SECRET,
        stripe: {
            webhooks: stripe.webhooks,
            checkout: {
                sessions: {
                    retrieve: async (id, options) => {
                        assert.equal(id, 'cs_test_lifetime')
                        assert.deepEqual(options, { expand: ['line_items.data.price'] })
                        return {
                            id,
                            payment_status: 'paid',
                            mode: 'payment',
                            client_reference_id: USER_ID,
                            metadata: { user_id: USER_ID, plan: 'monthly' },
                            customer: 'cus_test_lifetime',
                            payment_intent: 'pi_test_lifetime',
                            subscription: null,
                            customer_details: { email: ' Buyer@Example.com ' },
                            line_items: { data: [{ price: { id: 'price_test_lifetime' } }] },
                        }
                    },
                },
            },
        },
        recordEntitlement: async (args) => {
            rpcCalls.push({ name: 'record_stripe_entitlement', args })
            return {
                data: [{ outcome: 'granted', owner_user_id: USER_ID, plan: 'lifetime', capture_conversion: true }],
                error: null,
            }
        },
        priceIds: { monthly: 'price_test_monthly', lifetime: 'price_test_lifetime' },
        emailHmac: { key: EMAIL_HMAC_KEY, keyVersion: 1 },
    })

    assert.deepEqual(result, { handled: true, userId: USER_ID, plan: 'lifetime', captureConversion: true })
    assert.equal(rpcCalls.length, 1)
    assert.deepEqual(rpcCalls[0], {
        name: 'record_stripe_entitlement',
        args: {
            p_event_id: 'evt_test_lifetime',
            p_event_type: 'checkout.session.completed',
            p_stripe_created_at: '2024-08-30T06:40:00.000Z',
            p_payload_digest: createHash('sha256').update(payload).digest('hex'),
            p_checkout_session_id: 'cs_test_lifetime',
            p_origin_user_id: USER_ID,
            p_plan: 'lifetime',
            p_status: 'active',
            p_payment_intent_id: 'pi_test_lifetime',
            p_subscription_id: null,
            p_customer_id: 'cus_test_lifetime',
            p_checkout_email_hmac: createHmac('sha256', EMAIL_HMAC_KEY).update('buyer@example.com').digest('hex'),
            p_checkout_email_hmac_key_version: 1,
        },
    })
})
