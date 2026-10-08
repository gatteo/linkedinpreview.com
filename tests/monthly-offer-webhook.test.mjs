import assert from 'node:assert/strict'
import test from 'node:test'

import { loadTS } from './helpers/component-harness.mjs'

const exposureId = '11111111-1111-4111-8111-111111111111'
async function webhook(event, fail = false) {
    const captured = []
    const writes = []
    const route = await loadTS(
        'app/api/billing/webhook/route.ts',
        {
            'next/server': { after: (fn) => fn() },
            '@/env.mjs': { env: { STRIPE_WEBHOOK_SECRET: 'synthetic-not-a-secret' } },
            '@/lib/analytics/server': { captureServer: async (...args) => captured.push(args) },
            '@/lib/stripe': {
                isStripeConfigured: () => true,
                getStripe: () => ({
                    webhooks: { constructEvent: () => event },
                    subscriptions: { retrieve: async () => ({ id: 'synthetic-sub', items: { data: [] } }) },
                }),
            },
            '@/lib/supabase/admin': { createAdminClient: () => ({}) },
            '@/lib/supabase/billing': {
                findUserIdByStripeCustomer() {},
                upsertBillingPlan: async (_admin, id, patch) => {
                    if (fail) throw Error('synthetic failure')
                    writes.push({ id, patch })
                },
            },
        },
        { console: { ...console, error() {} } },
    )
    const result = await route.POST(
        new Request('https://preview.invalid/api/billing/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': 'synthetic' },
            body: '{}',
        }),
    )
    return { result, captured, writes }
}

test('processor-confirmed purchase events retain attribution without changing entitlements or retry behavior', async () => {
    for (const mode of ['subscription', 'payment']) {
        const event = {
            id: 'synthetic-event',
            livemode: true,
            type: 'checkout.session.completed',
            data: {
                object: {
                    mode,
                    id: 'synthetic-session',
                    payment_status: 'paid',
                    subscription: mode === 'subscription' ? 'synthetic-sub' : null,
                    amount_total: mode === 'subscription' ? 1199 : 3999,
                    currency: 'usd',
                    metadata: {
                        user_id: 'synthetic-user',
                        entry_source: 'tool_footer',
                        exposure_id: exposureId,
                        activation_version: 'imported_draft_v1',
                        enrollment_id: exposureId,
                        cohort_id: 'exp9_monthly_first_v2',
                        eligibility_at: '2026-10-05T20:00:00.000Z',
                    },
                },
            },
        }
        const success = await webhook(event)
        assert.equal(success.result.status, 200)
        assert.equal(success.writes[0].patch.plan, mode === 'subscription' ? 'pro' : 'lifetime')
        assert.equal(success.captured[0][1], 'purchase_completed')
        assert.equal(success.captured[0][2].enrollment_id, exposureId)
        assert.equal(success.captured[0][2].stripe_event_id, 'synthetic-event')
        assert.equal(success.captured[0][2].session_id, 'synthetic-session')
        assert.equal(success.captured[0][2].livemode, true)
        assert.equal(success.captured[0][2].payment_status, 'paid')
        assert.equal(success.captured[0][2].recurring_outcome, 'requires_processor_reconciliation')
        assert.equal(success.captured[0][2].entry_source, 'tool_footer')
        const failed = await webhook(event, true)
        assert.equal(failed.result.status, 500)
        assert.equal(failed.captured.length, 0)
    }
})
