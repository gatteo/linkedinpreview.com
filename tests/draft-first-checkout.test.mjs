import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'

import { loadTS } from './helpers/component-harness.mjs'

const entry = await loadTS('config/entry-sources.ts')
const bodySchema = (
    await loadTS('app/api/billing/checkout/route.schema.ts', { 'zod': { z }, '@/config/entry-sources': entry })
).bodySchema
const exposureId = '11111111-1111-4111-8111-111111111111'

async function checkout(ui = 'hosted', authenticated = true) {
    const created = []
    const route = await loadTS('app/api/billing/checkout/route.ts', {
        '@/config/entry-sources': entry,
        '@/config/pricing': { CHECKOUT_UI: ui },
        '@/lib/draft-first': { DRAFT_FIRST_VERSION: 'imported_draft_v1' },
        '@/lib/dev/missing-env': { devMissingEnv: () => ({}) },
        '@/lib/stripe': {
            getStripe: () => ({
                checkout: {
                    sessions: {
                        create: async (params) => {
                            created.push(params)
                            return {
                                id: 'synthetic-session',
                                url: 'https://checkout.invalid',
                                client_secret: 'synthetic-not-a-secret',
                            }
                        },
                    },
                },
            }),
            isStripeConfigured: () => true,
            missingStripeEnv: () => [],
            priceIdFor: (plan) => `synthetic-${plan}`,
        },
        '@/lib/supabase/server': {
            createClient: async () => ({
                auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'synthetic-user' } : null } }) },
            }),
        },
        './route.schema': { bodySchema },
    })
    const post = (body) =>
        route.POST(
            new Request('https://preview.invalid/api/billing/checkout', { method: 'POST', body: JSON.stringify(body) }),
        )
    return { post, created }
}

test('actual checkout validates attribution and leaves old callers, auth and prices intact', async () => {
    const c = await checkout()
    assert.equal((await c.post({ plan: 'monthly', entrySource: 'evil&plan=lifetime' })).status, 400)
    assert.equal((await c.post({ plan: 'monthly', exposureId: 'broken' })).status, 400)
    assert.equal(c.created.length, 0)
    assert.equal((await c.post({ plan: 'monthly' })).status, 200)
    assert.equal(c.created[0].metadata.entry_source, 'direct')
    assert.equal(c.created[0].line_items[0].price, 'synthetic-monthly')
    assert.equal(c.created[0].mode, 'subscription')
    const unauth = await checkout('hosted', false)
    assert.equal((await unauth.post({ plan: 'monthly' })).status, 401)
    assert.equal(unauth.created.length, 0)
})

test('hosted and embedded checkout retain first entry in processor metadata for both plans', async () => {
    for (const ui of ['hosted', 'embedded']) {
        for (const plan of ['monthly', 'lifetime']) {
            const c = await checkout(ui)
            assert.equal(
                (await c.post({ plan, source: 'upgrade', entrySource: 'tool_footer', exposureId })).status,
                200,
            )
            const params = c.created[0]
            assert.equal(params.metadata.exposure_id, exposureId)
            assert.equal(params.metadata.entry_source, 'tool_footer')
            assert.equal(params.metadata.activation_version, 'imported_draft_v1')
            assert.equal(params.client_reference_id, 'synthetic-user')
            assert.equal(params.mode, plan === 'monthly' ? 'subscription' : 'payment')
            if (ui === 'hosted') {
                for (const href of [params.success_url, params.cancel_url]) {
                    const url = new URL(href)
                    assert.equal(url.searchParams.get('from'), 'billing_return')
                    assert.equal(url.searchParams.get('entry_source'), 'tool_footer')
                    assert.equal(url.searchParams.get('activation'), exposureId)
                    assert.equal(url.searchParams.get('source'), 'upgrade')
                }
            } else {
                assert.equal(params.redirect_on_completion, 'never')
                assert.equal(params.success_url, undefined)
            }
        }
    }
})

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
            type: 'checkout.session.completed',
            data: {
                object: {
                    mode,
                    subscription: mode === 'subscription' ? 'synthetic-sub' : null,
                    amount_total: mode === 'subscription' ? 1199 : 3999,
                    currency: 'usd',
                    metadata: {
                        user_id: 'synthetic-user',
                        entry_source: 'tool_footer',
                        exposure_id: exposureId,
                        activation_version: 'imported_draft_v1',
                    },
                },
            },
        }
        const success = await webhook(event)
        assert.equal(success.result.status, 200)
        assert.equal(success.writes[0].patch.plan, mode === 'subscription' ? 'pro' : 'lifetime')
        assert.equal(success.captured[0][1], 'purchase_completed')
        assert.equal(success.captured[0][2].exposure_id, exposureId)
        assert.equal(success.captured[0][2].entry_source, 'tool_footer')
        const failed = await webhook(event, true)
        assert.equal(failed.result.status, 500)
        assert.equal(failed.captured.length, 0)
    }
})
