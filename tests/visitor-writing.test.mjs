import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'

import { browser, hooks, loadTS, tick } from './helpers/component-harness.mjs'

const lib = await loadTS('lib/visitor-writing.ts')
const entry = await loadTS('config/entry-sources.ts')
const schema = (
    await loadTS('app/api/billing/checkout/route.schema.ts', { 'zod': { z }, '@/config/entry-sources': entry })
).bodySchema
const USER = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'
const receipt = {
    enrollmentId: OTHER,
    userId: USER,
    eligibilityAt: '2026-10-10T15:00:00.000Z',
    releaseSha: 'a'.repeat(40),
    version: 'visitor_writing_v1',
    historicalOverlap: 'unknown',
}
const doc = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Synthetic useful writing' }] }],
}
function store() {
    const map = new Map()
    return {
        get length() {
            return map.size
        },
        key: (i) => [...map.keys()][i] ?? null,
        getItem: (k) => map.get(k) ?? null,
        setItem: (k, v) => map.set(k, v),
        removeItem: (k) => map.delete(k),
    }
}
function billingClient(scenario = {}) {
    return {
        from: (table) => {
            assert.equal(table, 'billing')
            return {
                select: () => ({
                    eq: (key, id) => {
                        assert.equal(key, 'user_id')
                        assert.equal(id, USER)
                        return {
                            maybeSingle: async () =>
                                scenario.error
                                    ? { data: null, error: { code: scenario.error } }
                                    : {
                                          data: scenario.absent
                                              ? null
                                              : {
                                                    user_id: scenario.rowUser ?? USER,
                                                    plan: scenario.plan ?? 'free',
                                                    ...scenario.row,
                                                },
                                          error: null,
                                      },
                        }
                    },
                }),
            }
        },
    }
}
async function controller(scenario = {}) {
    const h = hooks(),
        local = store(),
        session = store(),
        events = [],
        writes = [],
        locations = []
    const window = browser(scenario.url ?? 'https://preview.invalid/')
    window.location.assign = (url) => locations.push(url)
    let userId = USER,
        listener,
        billing = scenario.billing ?? {}
    const client = {
        ...billingClient(billing),
        auth: {
            getUser: async () => ({ data: { user: scenario.noUser ? null : { id: userId } }, error: null }),
            onAuthStateChange: (callback) => {
                listener = callback
                return { data: { subscription: { unsubscribe() {} } } }
            },
        },
    }
    if (scenario.seed) for (const [key, value] of Object.entries(scenario.seed)) local.setItem(key, value)
    if (scenario.writeFails)
        local.setItem = () => {
            throw Error('Blocked storage')
        }
    const controllerModule = await loadTS(
        'components/tool/visitor-writing-flow.tsx',
        {
            'react': { ...h.react, createContext: () => ({ Provider: 'provider' }) },
            'react/jsx-runtime': h.jsx,
            'posthog-js': {
                default: {
                    capture: (event, props) => events.push([event, props]),
                    identify: (id) => events.push(['identify', id]),
                },
                __esModule: true,
            },
            '@/config/feedback': { feedbackConfig: { storage: { dismissedAt: 'dismissed' }, formId: '' } },
            '@/config/pricing': {},
            '@/lib/supabase/client': { createClient: () => client },
            '@/lib/supabase/billing': { fetchBilling: async () => ({ plan: scenario.returnPaid ? 'pro' : 'free' }) },
            '@/lib/visitor-writing': lib,
            '@/components/ui/button': { Button: 'button' },
        },
        {
            window,
            localStorage: local,
            sessionStorage: session,
            process: { env: { NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: 'a'.repeat(40) } },
            fetch: async (_url, options) => {
                writes.push(JSON.parse(options.body))
                return Response.json(
                    scenario.checkoutFails ? {} : { url: 'https://checkout.invalid', sessionId: 'synthetic-session' },
                    { status: scenario.checkoutFails ? 500 : 200 },
                )
            },
        },
    )
    const render = () => h.render(() => controllerModule.useVisitorWritingController(scenario.enabled !== false))
    render()
    render()
    const useful = () => {
        render().start()
        render().inserted(doc)
        render().previewed(doc)
        render().copied(doc)
    }
    return {
        render,
        useful,
        local,
        session,
        events,
        writes,
        locations,
        window,
        h,
        changeIdentity: (id) => {
            userId = id
            listener?.('SIGNED_IN', { user: { id } })
        },
        paid: () => {
            client.from = billingClient({ plan: 'pro' }).from
        },
    }
}

test('local absence is compatible UNKNOWN, not globally unenrolled proof', () => {
    assert.equal(lib.writingExclusion(store(), store()), null)
    assert.equal(lib.writingProperties(receipt).historical_overlap, 'unknown')
})
for (const key of [
    'lp-daily-test-enrollment-v1',
    'lp-monthly-offer:account',
    'lp-draft-first:pending',
    'lp-draft-first:account',
]) {
    test(`known ${key} excludes without changing old assignments or clocks`, () => {
        const local = store(),
            session = store(),
            value = JSON.stringify({ eligibilityAt: 'original', variant: 'original' })
        local.setItem(key, value)
        assert.equal(lib.writingExclusion(local, session), 'known_enrollment')
        assert.equal(local.getItem(key), value)
        local.setItem(key, '{')
        assert.equal(lib.writingExclusion(local, session), 'corrupt_exclusion_state')
    })
}
test('unreadable storage and corrupt new receipt fail closed', () => {
    assert.equal(
        lib.writingExclusion(
            {
                get length() {
                    throw Error('Denied')
                },
            },
            store(),
        ),
        'storage_unavailable',
    )
    const local = store()
    local.setItem(lib.VISITOR_WRITING_KEY, '{}')
    assert.throws(() => lib.readWritingEnrollment(local))
})
for (const scenario of [{ error: 'PGRST116' }, { error: 'NETWORK' }, { rowUser: OTHER }, { row: { plan: null } }]) {
    test(`billing errors/mismatch/null plan are unresolved: ${JSON.stringify(scenario)}`, async () => {
        await assert.rejects(lib.readVisitorWritingPlan(billingClient(scenario), USER))
    })
}
for (const scenario of [
    { plan: 'pro' },
    { plan: 'lifetime' },
    { row: { stripe_customer_id: 'synthetic-prior-customer' } },
]) {
    test(`paid/prior-provider-linked rows unavailable: ${JSON.stringify(scenario)}`, async () => {
        assert.equal(await lib.readVisitorWritingPlan(billingClient(scenario), USER), 'unavailable')
    })
}
test('resolved own free and resolved no-row identities are free, no billing writes', async () => {
    assert.equal(await lib.readVisitorWritingPlan(billingClient(), USER), 'free')
    assert.equal(await lib.readVisitorWritingPlan(billingClient({ absent: true }), USER), 'free')
})
test('only actual accepted insertion, seen current preview and successful matching copy qualify', async () => {
    const c = await controller()
    c.render().start()
    c.render().copied(doc)
    assert.equal(c.render().valueReady, false)
    c.render().inserted(doc)
    c.render().copied(doc)
    assert.equal(c.render().valueReady, false)
    c.render().previewed({ type: 'doc' })
    c.render().copied(doc)
    assert.equal(c.render().valueReady, false)
    c.render().previewed(doc)
    c.render().copied({ type: 'doc' })
    assert.equal(c.render().valueReady, false)
    c.render().copied(doc)
    assert.equal(c.render().valueReady, true)
    assert.equal(c.render().offerOpen, false)
    assert.equal(c.local.getItem(lib.VISITOR_WRITING_KEY), null)
    await c.render().offer()
    assert.equal(c.render().offerOpen, true)
    assert.ok(
        c.events.findIndex(([name]) => name === 'job_flow_eligible') >
            c.events.findIndex(([name]) => name === 'job_useful_copy'),
    )
    assert.equal(c.events.filter(([name]) => name === 'job_flow_eligible').length, 1)
    const first = c.local.getItem(lib.VISITOR_WRITING_KEY)
    await c.render().offer()
    assert.equal(c.local.getItem(lib.VISITOR_WRITING_KEY), first)
    assert.equal(c.events.filter(([name]) => name === 'job_flow_eligible').length, 1)
})
for (const scenario of [
    { noUser: true },
    { billing: { plan: 'pro' } },
    { billing: { error: 'NETWORK' } },
    { writeFails: true },
    { seed: { 'lp-visitor-writing-v1': '{' } },
    { seed: { 'lp-daily-test-enrollment-v1': '{}' } },
]) {
    test(`no purchase treatment for unavailable state: ${JSON.stringify(scenario)}`, async () => {
        const c = await controller(scenario)
        c.useful()
        await c.render().offer()
        assert.equal(c.render().offerOpen, false)
        assert.equal(c.events.filter(([name]) => name === 'job_flow_eligible').length, 0)
        assert.equal(c.writes.length, 0)
    })
}
test('AI failures, empty, refused and rate-limited output do not produce useful value', async () => {
    for (const text of ['', '   ', '[REFUSED] no', '[RATE_LIMITED] no'])
        assert.equal(lib.acceptedWritingValue(text), false)
    const c = await controller()
    c.render().start()
    c.render().failed()
    await c.render().offer()
    assert.equal(c.render().offerOpen, false)
    assert.equal(c.events.filter(([name]) => name === 'job_ai_failed').length, 1)
})
test('embedded/non-home routes cannot enter the branch', async () => {
    for (const scenario of [
        { enabled: false },
        { url: 'https://preview.invalid/embed' },
        { url: 'https://preview.invalid/blog' },
    ]) {
        const c = await controller(scenario)
        c.useful()
        await c.render().offer()
        assert.equal(c.events.length, 0)
        assert.equal(c.render().offerOpen, false)
    }
})
test('identity change closes offer; paid recheck cannot start Checkout', async () => {
    const c = await controller()
    c.useful()
    await c.render().offer()
    c.render()
    c.changeIdentity(OTHER)
    assert.equal(c.render().offerOpen, false)
    await c.render().checkout('monthly')
    assert.equal(c.writes.length, 0)
    const paid = await controller()
    paid.useful()
    await paid.render().offer()
    paid.render()
    paid.paid()
    await paid.render().checkout('monthly')
    assert.equal(paid.writes.length, 0)
    assert.equal(paid.render().offerOpen, false)
})
test('checkout failure remains in original eligibility; monthly/lifetime send isolated receipt', async () => {
    for (const plan of ['monthly', 'lifetime']) {
        const c = await controller()
        c.useful()
        await c.render().offer()
        await c.render().checkout(plan)
        assert.equal(c.writes[0].source, 'visitor_job')
        assert.equal(c.writes[0].jobOffer.userId, USER)
        assert.equal(c.writes[0].plan, plan)
        assert.deepEqual(c.locations, ['https://checkout.invalid'])
    }
    const c = await controller({ checkoutFails: true })
    c.useful()
    await c.render().offer()
    const original = c.local.getItem(lib.VISITOR_WRITING_KEY)
    await c.render().checkout('monthly')
    assert.equal(c.local.getItem(lib.VISITOR_WRITING_KEY), original)
    assert.equal(c.events.filter(([name]) => name === 'job_checkout_failed').length, 1)
    assert.equal(c.locations.length, 0)
})
test('format discriminator skip continues optional help, free dismissal closes purchase', async () => {
    const c = await controller()
    c.render().discovery()
    c.render().chooseJob('write')
    assert.equal(c.render().showFormat, true)
    c.render().dismiss()
    assert.equal(c.render().showFormat, false)
    assert.equal(c.render().showPrompt, true)
    c.useful()
    await c.render().offer()
    c.render().dismiss()
    assert.equal(c.render().offerOpen, false)
    assert.equal(c.render().showPrompt, false)
})
test('cancel/success return binds exact stored receipt, does not optimistically mark paid', async () => {
    for (const status of ['cancelled', 'success']) {
        const c = await controller({
            url: `https://preview.invalid/?source=visitor_job&checkout=${status}&job_enrollment=${OTHER}&session_id=synthetic#tool`,
            seed: { [lib.VISITOR_WRITING_KEY]: JSON.stringify(receipt) },
        })
        await tick()
        c.render()
        assert.equal(c.events.filter(([name]) => name === 'job_checkout_return').length, 1)
        assert.equal(c.events.filter(([name]) => name === 'job_paid_return_verified').length, 0)
        assert.equal(c.window.location.search, '')
        assert.equal(c.local.getItem(lib.VISITOR_WRITING_KEY), JSON.stringify(receipt))
    }
})

async function checkoutRoute(scenario = {}) {
    const created = []
    const route = await loadTS('app/api/billing/checkout/route.ts', {
        '@/config/entry-sources': entry,
        '@/config/pricing': { CHECKOUT_UI: scenario.ui ?? 'hosted' },
        '@/lib/draft-first': { DRAFT_FIRST_VERSION: 'imported_draft_v1' },
        '@/lib/visitor-writing': lib,
        '@/lib/dev/missing-env': { devMissingEnv: () => ({}) },
        '@/lib/stripe': {
            isStripeConfigured: () => true,
            missingStripeEnv: () => [],
            priceIdFor: (plan) => `synthetic-${plan}`,
            getStripe: () => ({
                checkout: {
                    sessions: {
                        create: async (params) => {
                            created.push(params)
                            return { id: 'synthetic', url: 'https://checkout.invalid' }
                        },
                    },
                },
            }),
        },
        '@/lib/supabase/server': {
            createClient: async () => ({
                ...billingClient(scenario),
                auth: { getUser: async () => ({ data: { user: { id: scenario.user ?? USER } } }) },
            }),
        },
        './route.schema': { bodySchema: schema },
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
test('real schema rejects incomplete and mixed old attribution while preserving legacy default', () => {
    assert.equal(schema.safeParse({ plan: 'monthly' }).success, true)
    assert.equal(schema.safeParse({ plan: 'monthly', source: 'visitor_job' }).success, false)
    assert.equal(schema.safeParse({ plan: 'monthly', source: 'upgrade', jobOffer: receipt }).success, false)
    assert.equal(
        schema.safeParse({ plan: 'monthly', source: 'visitor_job', jobOffer: receipt, exposureId: OTHER }).success,
        false,
    )
})
test('real hosted route binds both plans, public return and processor metadata, no old enrollment relabel', async () => {
    for (const plan of ['monthly', 'lifetime']) {
        const c = await checkoutRoute()
        assert.equal((await c.post({ plan, source: 'visitor_job', jobOffer: receipt })).status, 200)
        const params = c.created[0],
            metadata = plan === 'monthly' ? params.subscription_data.metadata : params.payment_intent_data.metadata
        assert.equal(metadata.job_enrollment_id, OTHER)
        assert.equal(metadata.historical_overlap, 'unknown')
        assert.equal(metadata.enrollment_id, undefined)
        assert.equal(params.mode, plan === 'monthly' ? 'subscription' : 'payment')
        assert.equal(new URL(params.success_url).pathname, '/')
        assert.equal(new URL(params.cancel_url).searchParams.get('job_enrollment'), OTHER)
        assert.equal(new URL(params.success_url).searchParams.get('session_id'), '{CHECKOUT_SESSION_ID}')
    }
})
test('changed or missing same-tab writing receipt cannot start Checkout', async () => {
    for (const raw of [null, '{', JSON.stringify({ ...receipt, eligibilityAt: '2026-10-10T16:00:00.000Z' })]) {
        const c = await controller()
        c.useful()
        await c.render().offer()
        if (raw === null) c.local.removeItem(lib.VISITOR_WRITING_KEY)
        else c.local.setItem(lib.VISITOR_WRITING_KEY, raw)
        await c.render().checkout('monthly')
        assert.equal(c.writes.length, 0)
        assert.equal(c.render().offerOpen, false)
    }
})

test('later known enrollment suppresses an already-open offer on next Checkout', async () => {
    const c = await controller()
    c.useful()
    await c.render().offer()
    c.local.setItem('lp-daily-test-enrollment-v1', JSON.stringify({ eligibilityAt: 'original' }))
    await c.render().checkout('monthly')
    assert.equal(c.writes.length, 0)
    assert.equal(c.render().offerOpen, false)
    assert.equal(c.local.getItem('lp-daily-test-enrollment-v1'), JSON.stringify({ eligibilityAt: 'original' }))
})

for (const scenario of [
    { plan: 'pro' },
    { plan: 'lifetime' },
    { error: 'NETWORK' },
    { user: OTHER },
    { ui: 'embedded' },
]) {
    test(`server prevents provider call for unavailable job purchase: ${JSON.stringify(scenario)}`, async () => {
        const c = await checkoutRoute(scenario)
        assert.ok(
            [409, 503].includes((await c.post({ plan: 'monthly', source: 'visitor_job', jobOffer: receipt })).status),
        )
        assert.equal(c.created.length, 0)
    })
}
