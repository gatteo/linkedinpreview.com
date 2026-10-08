import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'

import { browser, hooks, loadTS, storage } from './helpers/component-harness.mjs'

const entry = await loadTS('config/entry-sources.ts')
const id = '11111111-1111-4111-8111-111111111111'
const userId = 'synthetic-account'
const monthlyOffer = {
    enrollmentId: id,
    cohortId: 'exp9_monthly_first_v2',
    assignedVariant: 'monthly_first',
    eligibilityAt: '2026-10-05T20:00:00.000Z',
    offerVersion: 'monthly_first_v2',
    entrySource: 'tool_footer',
    billingState: 'free',
    releaseSha: 'a'.repeat(40),
}

async function attribution(local = storage()) {
    return loadTS(
        'lib/monthly-offer.ts',
        { '@/config/entry-sources': entry },
        {
            localStorage: local,
            window: { innerWidth: 400 },
            process: { env: { NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: 'a'.repeat(40) } },
        },
    )
}

test('eligibility persists before capture, dedupes remounts and retains original source and clock', async () => {
    const local = storage()
    const events = []
    const a = await attribution(local)
    a.rememberOfferEntry('tool_footer')
    const state = a.enrollMonthlyOffer({
        userId,
        billingState: 'free',
        isAnonymous: true,
        capture(event, props) {
            assert.ok(local.getItem('lp-monthly-offer:' + userId))
            events.push({ event, props })
        },
    })
    a.rememberOfferEntry('billing_return')
    const second = a.enrollMonthlyOffer({
        userId,
        billingState: 'free',
        isAnonymous: false,
        capture() {
            throw Error('re-enrolled')
        },
    })
    assert.equal(second.enrollmentId, state.enrollmentId)
    assert.equal(second.eligibilityAt, state.eligibilityAt)
    assert.equal(events.length, 1)
    assert.equal(events[0].event, 'paid_conversion_eligible')
    assert.equal(events[0].props.entry_source, 'tool_footer')
    assert.equal(events[0].props.identity_state, 'anonymous')
    assert.equal(events[0].props.device_class, 'mobile')
    const reload = await attribution(local)
    reload.rememberOfferEntry('oauth_return')
    assert.equal(reload.monthlyCheckoutAttribution(userId).enrollmentId, state.enrollmentId)
    assert.equal(reload.monthlyCheckoutAttribution(userId).entrySource, 'tool_footer')
    assert.equal(reload.monthlyCheckoutAttribution('another-account'), undefined)
})

test('unknown billing and paid guardrails never masquerade as verified unpaid enrollment', async () => {
    for (const billingState of ['unknown', 'paid']) {
        const a = await attribution()
        const state = a.enrollMonthlyOffer({ userId, billingState, isAnonymous: false, capture() {} })
        assert.equal(a.monthlyOfferProperties(state).billing_state_at_assignment, billingState)
    }
})

test('pre-auth enrollment bridges once to identified account without resetting eligibility', async () => {
    const a = await attribution()
    const events = []
    const capture = (event) => events.push(event)
    const anonymous = a.enrollMonthlyOffer({ userId: null, billingState: 'unknown', isAnonymous: true, capture })
    const known = a.enrollMonthlyOffer({ userId, billingState: 'free', isAnonymous: false, capture })
    a.enrollMonthlyOffer({ userId, billingState: 'free', isAnonymous: false, capture })
    assert.equal(known.enrollmentId, anonymous.enrollmentId)
    assert.equal(known.eligibilityAt, anonymous.eligibilityAt)
    assert.deepEqual(events, ['paid_conversion_eligible', 'paid_conversion_identity_linked'])
})

test('actual paywall gate commits eligibility before mounting the treatment', async () => {
    const h = hooks()
    const a = await attribution()
    let isLoading = true
    const events = []
    const empty = () => null
    const all = {
        'react': h.react,
        'react/jsx-runtime': h.jsx,
        'framer-motion': { motion: {} },
        'lucide-react': {},
        '@/config/onboarding-flow': { OB_TICKET: { spotsStart: 10 } },
        '@/config/onboarding-personalization': {},
        '@/config/pricing': {},
        '@/config/social-proof': {},
        '@/lib/monthly-offer': a,
        '@/lib/utils': {},
        '@/hooks/use-plan': {
            usePlan: () => ({ isLoading, isPaid: false, billingResolved: true, billingUserId: userId }),
        },
        '@/components/dashboard/auth-provider': { useAuth: () => ({ userId, isReady: true, isAnonymous: true }) },
        '@/components/tool/preview/post-card': {},
        '@/components/tool/preview/preview-size-context': {},
        '../ai': { track: (event) => events.push(event) },
        '../charts': {},
        '../context': {},
        '../icons': {},
        '../primitives': {},
        '../types': {},
        '../use-scroll-gate': { useScrollGate: empty },
        './checkout': {},
    }
    const { PaywallStep, MonthlyOffer } = await loadTS('components/dashboard/onboarding/steps/paywall-step.tsx', all)
    assert.notEqual(h.render(PaywallStep).type, MonthlyOffer)
    assert.equal(events.length, 0)
    isLoading = false
    assert.notEqual(h.render(PaywallStep).type, MonthlyOffer)
    assert.deepEqual(events, ['paid_conversion_eligible'])
    assert.equal(h.render(PaywallStep).type, MonthlyOffer)
    assert.deepEqual(events, ['paid_conversion_eligible'])
})

const bodySchema = (
    await loadTS('app/api/billing/checkout/route.schema.ts', { 'zod': { z }, '@/config/entry-sources': entry })
).bodySchema
async function checkout(ui, authenticated = true) {
    const created = []
    const route = await loadTS('app/api/billing/checkout/route.ts', {
        '@/config/entry-sources': entry,
        '@/config/pricing': { CHECKOUT_UI: ui },
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
                                client_secret: 'synthetic-fixture',
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
                auth: { getUser: async () => ({ data: { user: authenticated ? { id: userId } : null } }) },
            }),
        },
        './route.schema': { bodySchema },
    })
    return {
        created,
        post: (body) =>
            route.POST(
                new Request('https://preview.invalid/api/billing/checkout', {
                    method: 'POST',
                    body: JSON.stringify(body),
                }),
            ),
    }
}

test('actual hosted/embedded processor parameters preserve identity, price, monthly cohort and lifetime alternative', async () => {
    for (const ui of ['hosted', 'embedded'])
        for (const plan of ['monthly', 'lifetime']) {
            const c = await checkout(ui)
            const response = await c.post({ plan, source: 'onboarding', monthlyOffer })
            assert.equal(response.status, 200)
            assert.equal((await response.json()).sessionId, 'synthetic-session')
            const p = c.created[0]
            assert.equal(p.line_items[0].price, `synthetic-${plan}`)
            assert.equal(p.client_reference_id, userId)
            assert.equal(p.metadata.user_id, userId)
            assert.equal(p.metadata.enrollment_id, id)
            assert.equal(p.metadata.cohort_id, monthlyOffer.cohortId)
            assert.equal(p.metadata.entry_source, 'tool_footer')
            assert.equal(p.metadata.eligibility_at, monthlyOffer.eligibilityAt)
            const metadata = plan === 'monthly' ? p.subscription_data.metadata : p.payment_intent_data.metadata
            assert.deepEqual(metadata, p.metadata)
            assert.equal(p.mode, plan === 'monthly' ? 'subscription' : 'payment')
            if (ui === 'hosted')
                for (const href of [p.success_url, p.cancel_url]) {
                    const url = new URL(href)
                    assert.equal(url.searchParams.get('from'), 'billing_return')
                    assert.equal(url.searchParams.get('entry_source'), 'tool_footer')
                    assert.equal(url.searchParams.get('offer_enrollment'), id)
                }
            else assert.equal(p.redirect_on_completion, 'never')
        }
})

test('schema rejects partial/foreign attribution and auth remains authoritative; legacy callers still work', async () => {
    const c = await checkout('hosted')
    for (const changes of [
        { cohortId: 'foreign' },
        { assignedVariant: 'lifetime_first' },
        { enrollmentId: 'broken' },
        { entrySource: 'evil&plan=lifetime' },
        { eligibilityAt: 'broken' },
        { releaseSha: 'broken' },
    ]) {
        assert.equal((await c.post({ plan: 'monthly', monthlyOffer: { ...monthlyOffer, ...changes } })).status, 400)
    }
    assert.equal(c.created.length, 0)
    assert.equal((await c.post({ plan: 'monthly' })).status, 200)
    assert.equal(c.created[0].metadata.enrollment_id, undefined)
    const unauth = await checkout('hosted', false)
    assert.equal((await unauth.post({ plan: 'monthly', monthlyOffer })).status, 401)
    assert.equal(unauth.created.length, 0)
})

test('actual checkout client sends enrollment and records returned processor session, not paid success', async () => {
    const h = hooks()
    const w = browser('https://preview.invalid/dashboard')
    const requests = []
    const events = []
    w.location.assign = () => {}
    const { OnboardingCheckout } = await loadTS(
        'components/dashboard/onboarding/steps/checkout.tsx',
        {
            'react': h.react,
            'react/jsx-runtime': h.jsx,
            '@stripe/react-stripe-js': {},
            '@stripe/stripe-js': {},
            'lucide-react': {},
            '@/env.mjs': { env: {} },
            '@/config/pricing': { CHECKOUT_UI: 'hosted' },
            '@/lib/dev/report-missing-env': { reportMissingEnv() {} },
            '@/lib/monthly-offer': { monthlyCheckoutAttribution: () => monthlyOffer },
            '@/components/dashboard/auth-provider': { useAuth: () => ({ userId }) },
            '../ai': { track: (event, props) => events.push({ event, props }) },
            '../types': { markCheckoutPending() {} },
        },
        {
            window: w,
            fetch: async (_url, init) => {
                requests.push(JSON.parse(init.body))
                return Response.json({ url: 'https://checkout.invalid', sessionId: 'synthetic-session' })
            },
        },
    )
    h.render(() => OnboardingCheckout({ plan: 'monthly', source: 'onboarding', onComplete() {}, onError() {} }))
    await new Promise((resolve) => setImmediate(resolve))
    assert.deepEqual(requests[0].monthlyOffer, monthlyOffer)
    assert.equal(events[0].event, 'onb_checkout_opened')
    assert.equal(events[0].props.session_id, 'synthetic-session')
    assert.equal(
        events.some((e) => e.event.includes('purchase')),
        false,
    )
})
