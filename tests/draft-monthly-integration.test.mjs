import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'

import { hooks, loadTS } from './helpers/component-harness.mjs'

const entry = await loadTS('config/entry-sources.ts')
const exposure = '00000000-0000-4000-8000-000000000010'
const monthlyId = '00000000-0000-4000-8000-000000000009'
const draftClock = '2026-10-07T09:00:00.000Z'
const monthlyClock = '2026-10-07T10:00:00.000Z'
const monthlyOffer = {
    enrollmentId: monthlyId,
    cohortId: 'exp9_monthly_first_v2',
    assignedVariant: 'monthly_first',
    eligibilityAt: monthlyClock,
    offerVersion: 'monthly_first_v2',
    entrySource: 'navbar',
    billingState: 'free',
    releaseSha: '86011f3beb217cf5902a740a9b6cc5bd7033244a',
}
const draft = {
    entrySource: 'tool_footer',
    exposureId: exposure,
    cohortId: 'exp10_draft_first_v1',
    assignedVariant: 'draft_first',
    eligibilityAt: draftClock,
    offerVersion: 'existing_offer',
}
const bodySchema = (
    await loadTS('app/api/billing/checkout/route.schema.ts', { 'zod': { z }, '@/config/entry-sources': entry })
).bodySchema

for (const ui of ['hosted', 'embedded']) {
    for (const plan of ['monthly', 'lifetime']) {
        test(`integrated ${ui}/${plan}: both cohort clocks survive authenticated processor payload`, async () => {
            const created = []
            const route = await loadTS('app/api/billing/checkout/route.ts', {
                '@/config/entry-sources': entry,
                '@/config/pricing': { CHECKOUT_UI: ui },
                '@/lib/draft-first': { DRAFT_FIRST_VERSION: 'imported_draft_v1' },
                '@/lib/dev/missing-env': { devMissingEnv: () => ({}) },
                '@/lib/stripe': {
                    isStripeConfigured: () => true,
                    missingStripeEnv: () => [],
                    priceIdFor: (p) => `synthetic-${p}`,
                    getStripe: () => ({
                        checkout: {
                            sessions: {
                                create: async (params) => {
                                    created.push(params)
                                    return { id: 'fixture', url: 'https://checkout.invalid', client_secret: 'fixture' }
                                },
                            },
                        },
                    }),
                },
                '@/lib/supabase/server': {
                    createClient: async () => ({
                        auth: { getUser: async () => ({ data: { user: { id: 'server-user' } } }) },
                    }),
                },
                './route.schema': { bodySchema },
            })
            const res = await route.POST(
                new Request('https://preview.invalid/api/billing/checkout', {
                    method: 'POST',
                    body: JSON.stringify({ plan, source: 'upgrade', ...draft, monthlyOffer }),
                }),
            )
            assert.equal(res.status, 200)
            const payload = created[0]
            const metadata = payload.metadata
            assert.equal(payload.client_reference_id, 'server-user')
            assert.equal(metadata.user_id, 'server-user')
            assert.equal(metadata.enrollment_id, monthlyId)
            assert.equal(metadata.eligibility_at, monthlyClock)
            assert.equal(metadata.draft_enrollment_id, exposure)
            assert.equal(metadata.draft_eligibility_at, draftClock)
            assert.equal(metadata.exposure_id, exposure)
            assert.equal(metadata.entry_source, 'tool_footer')
            assert.equal(metadata.monthly_entry_source, 'navbar')
            assert.deepEqual(
                plan === 'monthly' ? payload.subscription_data.metadata : payload.payment_intent_data.metadata,
                metadata,
            )
            if (ui === 'hosted') {
                for (const href of [payload.success_url, payload.cancel_url]) {
                    const u = new URL(href)
                    assert.equal(u.searchParams.get('activation'), exposure)
                    assert.equal(u.searchParams.get('offer_enrollment'), monthlyId)
                    assert.equal(u.searchParams.get('entry_source'), 'tool_footer')
                    assert.equal(u.searchParams.get('from'), 'billing_return')
                }
            }
        })
    }
}

test('integrated real checkout component sends both envelopes without account borrowing', async () => {
    const h = hooks()
    const requests = []
    const checkout = await loadTS(
        'components/dashboard/onboarding/steps/checkout.tsx',
        {
            'react': h.react,
            'react/jsx-runtime': h.jsx,
            '@stripe/react-stripe-js': {},
            '@stripe/stripe-js': { loadStripe() {} },
            'lucide-react': {},
            '@/env.mjs': { env: {} },
            '@/config/pricing': { CHECKOUT_UI: 'hosted' },
            '@/lib/dev/report-missing-env': { reportMissingEnv() {} },
            '@/lib/draft-first': {
                draftFirstProperties: () => ({
                    exposure_id: exposure,
                    eligibility_at: draftClock,
                    cohort_id: draft.cohortId,
                    assigned_variant: draft.assignedVariant,
                    offer_version: draft.offerVersion,
                }),
            },
            '@/lib/monthly-offer': {
                monthlyCheckoutAttribution: (id) => {
                    assert.equal(id, 'server-user')
                    return monthlyOffer
                },
            },
            '@/components/dashboard/auth-provider': { useAuth: () => ({ userId: 'server-user' }) },
            '../ai': { getEntrySource: () => 'tool_footer', track() {} },
            '../types': { markCheckoutPending() {} },
        },
        {
            fetch: async (_url, init) => {
                requests.push(JSON.parse(init.body))
                return new Promise(() => {})
            },
        },
    )
    h.render(() => checkout.OnboardingCheckout({ plan: 'monthly', onComplete() {}, onError() {} }))
    assert.equal(requests.length, 1)
    assert.deepEqual(requests[0], { plan: 'monthly', source: 'upgrade', ...draft, monthlyOffer })
    h.unmount()
})

test('integrated actual track carries monthly generic and separately scoped draft IDs', async () => {
    const events = []
    const ai = await loadTS('components/dashboard/onboarding/ai.ts', {
        'posthog-js': { capture: (...args) => events.push(args) },
        '@/config/analytics': { OB_FUNNEL_VERSION: 'v3' },
        '@/lib/parse-formatted-text': { toTipTapParagraphs() {} },
        '@/lib/draft-first': {
            draftFirstProperties: () => ({
                exposure_id: exposure,
                enrollment_id: exposure,
                cohort_id: draft.cohortId,
                eligibility_at: draftClock,
                entry_source: 'tool_footer',
            }),
        },
        '@/lib/monthly-offer': {
            rememberOfferEntry() {},
            monthlyOfferProperties: () => ({
                enrollment_id: monthlyId,
                cohort_id: monthlyOffer.cohortId,
                eligibility_at: monthlyClock,
                entry_source: 'navbar',
            }),
        },
    })
    ai.setEntrySource('tool_footer')
    ai.track('onb_checkout_opened')
    const props = events[0][1]
    assert.equal(props.enrollment_id, monthlyId)
    assert.equal(props.eligibility_at, monthlyClock)
    assert.equal(props.draft_enrollment_id, exposure)
    assert.equal(props.draft_eligibility_at, draftClock)
    assert.equal(props.draft_entry_source, 'tool_footer')
    assert.equal(ai.getEntrySource(), 'tool_footer')
})
