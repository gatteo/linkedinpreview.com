import assert from 'node:assert/strict'
import test from 'node:test'

import { hooks, loadTS, storage, tick } from './helpers/component-harness.mjs'

async function harness() {
    const local = storage()
    const entry = await loadTS('config/entry-sources.ts')
    const billing = await loadTS('lib/billing.ts')
    const monthly = await loadTS(
        'lib/monthly-offer.ts',
        { '@/config/entry-sources': entry },
        {
            localStorage: local,
            window: { innerWidth: 1200 },
            process: { env: {} },
        },
    )
    const requests = []
    const channels = []
    const supabase = {
        channel() {
            const channel = {
                on(_kind, _filter, callback) {
                    this.callback = callback
                    return this
                },
                subscribe() {
                    return this
                },
            }
            channels.push(channel)
            return channel
        },
        removeChannel() {},
    }
    let auth = { isReady: true, userId: 'first', isAnonymous: false, supabase }
    const providerHooks = hooks()
    const gateHooks = hooks()
    const events = []
    let plan
    const { PlanProvider } = await loadTS(
        'components/dashboard/plan-provider.tsx',
        {
            'react': { ...providerHooks.react, createContext: () => ({ Provider: 'provider' }) },
            'react/jsx-runtime': providerHooks.jsx,
            '@/lib/billing': billing,
            '@/lib/supabase/billing': {
                fetchBilling: (_client, expectedUserId) =>
                    new Promise((resolve, reject) => requests.push({ userId: expectedUserId, resolve, reject })),
            },
            '@/components/dashboard/auth-provider': { useAuth: () => auth },
        },
        { console: { error() {} } },
    )
    const { PaywallStep, MonthlyOffer } = await loadTS('components/dashboard/onboarding/steps/paywall-step.tsx', {
        'react': gateHooks.react,
        'react/jsx-runtime': gateHooks.jsx,
        'framer-motion': { motion: {} },
        'lucide-react': {},
        '@/config/onboarding-flow': { OB_TICKET: { spotsStart: 10 } },
        '@/config/onboarding-personalization': {},
        '@/config/pricing': {},
        '@/config/social-proof': {},
        '@/lib/monthly-offer': monthly,
        '@/lib/utils': {},
        '@/hooks/use-plan': { usePlan: () => plan },
        '@/components/dashboard/auth-provider': { useAuth: () => auth },
        '@/components/tool/preview/post-card': {},
        '@/components/tool/preview/preview-size-context': {},
        '../ai': { track: (event, props) => events.push({ userId: auth.userId, event, props }) },
        '../charts': {},
        '../context': {},
        '../icons': {},
        '../primitives': {},
        '../types': {},
        '../use-scroll-gate': { useScrollGate() {} },
        './checkout': {},
    })
    return {
        monthly,
        events,
        requests,
        channels,
        switch(userId, isReady = true) {
            auth = { ...auth, userId, isReady }
        },
        render() {
            plan = providerHooks.render(() => PlanProvider({ children: null })).props.value
            return { plan, gate: gateHooks.render(PaywallStep), MonthlyOffer }
        },
        async resolve(index, paidPlan) {
            requests[index].resolve({ ...billing.DEFAULT_BILLING, plan: paidPlan })
            await tick()
        },
        async reject(index) {
            requests[index].reject(Error('synthetic read failure'))
            await tick()
        },
    }
}

for (const [first, second] of [
    ['free', 'pro'],
    ['pro', 'free'],
    ['free', 'lifetime'],
    ['lifetime', 'free'],
]) {
    test(`actual provider + offer gate isolate ${first} -> ${second} account assignment`, async () => {
        const h = await harness()
        h.render()
        await h.resolve(0, first)
        h.render()
        h.render()
        const previous = h.monthly.readMonthlyEnrollment('first')
        h.switch('second')
        const pending = h.render()
        assert.equal(h.requests[1].userId, 'second', 'billing read explicitly scopes current auth identity')
        assert.equal(pending.plan.isLoading, true, 'new identity must not inherit settled loading state')
        assert.equal(pending.plan.billingResolved, false)
        assert.equal(pending.gate.type, 'div')
        assert.equal(h.monthly.readMonthlyEnrollment('second'), null)
        assert.equal(h.events.filter((e) => e.userId === 'second').length, 0)
        h.render()
        assert.equal(h.monthly.readMonthlyEnrollment('second'), null)
        await h.resolve(1, second)
        h.render()
        const ready = h.render()
        assert.equal(ready.gate.type, ready.MonthlyOffer)
        const enrollment = h.monthly.readMonthlyEnrollment('second')
        assert.equal(enrollment.billingState, second === 'free' ? 'free' : 'paid')
        assert.equal(ready.plan.isPaid, second !== 'free')
        h.render()
        assert.equal(h.events.filter((e) => e.userId === 'second').length, 1)
        h.switch('first')
        h.render()
        assert.equal(h.monthly.readMonthlyEnrollment('first').enrollmentId, previous.enrollmentId)
        assert.equal(h.monthly.readMonthlyEnrollment('first').eligibilityAt, previous.eligibilityAt)
    })
}

test('initial pending read blocks enrollment; own failed read assigns unknown and retains original clock', async () => {
    const h = await harness()
    assert.equal(h.render().plan.isLoading, true)
    h.render()
    assert.equal(h.monthly.readMonthlyEnrollment('first'), null)
    await h.reject(0)
    const failed = h.render()
    assert.equal(failed.plan.isLoading, false)
    assert.equal(failed.plan.billingResolved, false)
    const enrollment = h.monthly.readMonthlyEnrollment('first')
    assert.equal(enrollment.billingState, 'unknown')
    h.render()
    h.render()
    assert.equal(h.events.length, 1)
    assert.equal(h.monthly.readMonthlyEnrollment('first').eligibilityAt, enrollment.eligibilityAt)
})

test('paid-to-other-account read failure never inherits paid or verified-free assignment', async () => {
    const h = await harness()
    h.render()
    await h.resolve(0, 'pro')
    h.render()
    h.render()
    h.switch('failed-account')
    h.render()
    assert.equal(h.monthly.readMonthlyEnrollment('failed-account'), null)
    await h.reject(1)
    const failed = h.render()
    assert.equal(failed.plan.isPaid, false)
    assert.equal(failed.plan.billingResolved, false)
    assert.equal(h.monthly.readMonthlyEnrollment('failed-account').billingState, 'unknown')
})

test('rapid identity changes ignore late read success/error and stale realtime callbacks', async () => {
    const h = await harness()
    h.render()
    h.switch('second')
    h.render()
    h.switch('third')
    h.render()
    await h.resolve(2, 'free')
    h.render()
    h.render()
    const before = h.monthly.readMonthlyEnrollment('third')
    await h.resolve(0, 'pro')
    await h.reject(1)
    h.channels[0].callback({ new: { plan: 'pro', user_id: 'first' } })
    h.channels[1].callback({ new: { plan: 'lifetime', user_id: 'second' } })
    const current = h.render()
    assert.equal(current.plan.plan, 'free')
    assert.equal(current.plan.billingResolved, true)
    assert.equal(h.monthly.readMonthlyEnrollment('first'), null)
    assert.equal(h.monthly.readMonthlyEnrollment('second'), null)
    assert.equal(h.monthly.readMonthlyEnrollment('third').enrollmentId, before.enrollmentId)
    assert.equal(h.events.length, 1)
    h.channels[2].callback({ new: { plan: 'pro', user_id: 'third' } })
    assert.equal(h.render().plan.isPaid, true, 'current-account realtime entitlements still update')
})

test('unready and failed anonymous auth do not inherit previous identity billing', async () => {
    const h = await harness()
    h.render()
    await h.resolve(0, 'pro')
    h.render()
    h.render()
    h.switch(null, false)
    assert.equal(h.render().plan.isLoading, true)
    h.switch(null, true)
    h.render()
    const anonymous = h.render()
    assert.equal(anonymous.plan.isPaid, false)
    assert.equal(anonymous.plan.billingResolved, false)
    assert.equal(h.events.at(-1).props.billing_state_at_assignment, 'unknown')
})
