import assert from 'node:assert/strict'
import test from 'node:test'

import { browser, hooks, loadTS, storage, tick } from './helpers/component-harness.mjs'

const brandingModule = await loadTS('lib/branding.ts')
const strategyModule = await loadTS('lib/strategy.ts')
const brandingApi = await loadTS('lib/supabase/branding.ts', { '@/lib/branding': brandingModule })
const strategyApi = await loadTS('lib/supabase/strategy.ts', { '@/lib/strategy': strategyModule })
const entry = await loadTS('config/entry-sources.ts')
const copy = (value) => JSON.parse(JSON.stringify(value))
const missing = { data: null, error: { code: 'PGRST116' } }
const failed = { data: null, error: { code: '42501', message: 'Synthetic read denied' } }
const row = (data) => ({ data: { data }, error: null })

async function setup({
    branding = missing,
    strategy = missing,
    url = '/dashboard',
    saved = null,
    authReady = true,
    userId = 'synthetic-one',
} = {}) {
    const h = hooks()
    const window = browser('https://preview.invalid' + url)
    const localStorage = storage()
    const reads = []
    const writes = []
    const errors = []
    const results = { branding, strategy }
    const supabase = {
        from(table) {
            return {
                select: () => ({
                    single: async () => {
                        reads.push(table)
                        const result = results[table]
                        if (result instanceof Error) throw result
                        return await result
                    },
                }),
                upsert: async (data) => {
                    writes.push({ table, data: copy(data) })
                    return { error: null }
                },
            }
        },
    }
    const auth = { isReady: authReady, userId, supabase }
    const authModule = { useAuth: () => auth }
    const hookMocks = {
        'react': h.react,
        'sonner': { toast: { error: (message) => errors.push(message) } },
        '@/components/dashboard/auth-provider': authModule,
    }
    const brandingHook = await loadTS('hooks/use-branding.ts', {
        ...hookMocks,
        '@/lib/branding': brandingModule,
        '@/lib/supabase/branding': brandingApi,
    })
    const strategyHook = await loadTS('hooks/use-strategy.ts', {
        ...hookMocks,
        '@/lib/strategy': strategyModule,
        '@/lib/supabase/strategy': strategyApi,
    })
    let currentBranding
    let currentStrategy
    const flow = await loadTS(
        'lib/draft-first.ts',
        { '@/config/entry-sources': entry },
        { window, localStorage, sessionStorage: storage() },
    )
    const router = { replace: (href) => window.history.replaceState({}, '', href), push() {} }
    let cleared = 0
    const controller = await loadTS(
        'components/dashboard/onboarding/onboarding-controller.tsx',
        {
            'react': h.react,
            'react/jsx-runtime': h.jsx,
            'next/navigation': { useRouter: () => router },
            '@/config/entry-sources': entry,
            '@/config/linkedin': { ONBOARDING_LINKEDIN_STATUSES: ['connected', 'denied', 'error'] },
            '@/config/routes': { Routes: { Dashboard: '/dashboard' } },
            '@/config/site': { site: {} },
            '@/lib/draft-first': flow,
            '@/lib/supabase/drafts': {},
            '@/lib/supabase/onboarding-session': {},
            '@/hooks/use-branding': {
                useBranding: () => (currentBranding = brandingHook.useBranding()),
            },
            '@/hooks/use-strategy': {
                useStrategy: () => (currentStrategy = strategyHook.useStrategy()),
            },
            '@/components/dashboard/auth-provider': authModule,
            './ai': { setEntrySource() {}, track() {}, postTextToDoc() {} },
            './debug-events': { onOnboardingDebug: () => () => {} },
            './onboarding-modal': { OnboardingModal: 'modal' },
            './types': {
                readOnboarding: () => saved,
                clearOnboarding: () => cleared++,
                initialAnswers: (b, s) => ({ branding: b, strategy: s }),
                persistOnboarding() {},
            },
        },
        { window, localStorage },
    )
    const render = () => h.render(controller.OnboardingController)
    const settle = async () => {
        render()
        await tick()
        render()
        return render()
    }
    await settle()
    return {
        h,
        auth,
        results,
        window,
        flow,
        render,
        settle,
        reads,
        writes,
        errors,
        get branding() {
            return currentBranding
        },
        get strategy() {
            return currentStrategy
        },
        get cleared() {
            return cleared
        },
    }
}

for (const url of [
    '/dashboard?source=upgrade&checkout=cancelled&from=billing_return',
    '/dashboard?source=upgrade&checkout=success&from=billing_return',
    '/dashboard?linkedin=merge-prompt',
]) {
    test(`initial auth bootstrap preserves return snapshot: ${url}`, async () => {
        const state = await setup({ url, authReady: false, userId: null })
        assert.equal(state.render(), null)
        state.window.history.replaceState({}, '', '/dashboard?from=billing_return')
        state.auth.isReady = true
        state.auth.userId = 'synthetic-one'
        assert.equal(await state.settle(), null)
        assert.equal(state.writes.length, 0)
        state.h.unmount()
    })
}

for (const [name, branding, strategy] of [
    ['branding', failed, row({ completedAt: '2026-01-01' })],
    ['strategy', missing, failed],
    ['both', new Error('Synthetic transport failure'), failed],
]) {
    test(`real hooks/controller: ${name} failure never opens automatic or explicit planning or writes defaults`, async () => {
        const state = await setup({ branding, strategy })
        assert.equal(state.render(), null)
        assert.equal(state.branding.isLoading, false)
        assert.equal(state.strategy.isLoading, false)
        assert.ok(state.branding.loadFailed || state.strategy.loadFailed)
        state.window.dispatchEvent(new Event('lp-request-planning'))
        assert.equal(state.render(), null)
        if (state.branding.loadFailed) assert.equal(state.branding.updateBranding({ role: 'founder' }), false)
        if (state.strategy.loadFailed) assert.equal(state.strategy.updateStrategy({ goals: ['authority'] }), false)
        assert.equal(state.writes.length, 0)
        assert.equal(state.errors.length > 0, true)
        for (let i = 0; i < 5; i++) await state.settle()
        assert.equal(state.reads.length, 2, 'no automatic retry loop')
        state.h.unmount()
        const explicit = await setup({ branding, strategy, url: '/dashboard?planning=1' })
        assert.equal(explicit.render(), null)
        assert.equal(explicit.writes.length, 0)
        explicit.h.unmount()
    })
}

test('successful PGRST116 and successful null reads remain known empty and open planning', async () => {
    for (const result of [missing, { data: null, error: null }]) {
        const state = await setup({ branding: result, strategy: result })
        assert.equal(state.render().type, 'modal')
        assert.equal(state.branding.loadFailed, false)
        assert.equal(state.strategy.loadFailed, false)
        assert.equal(state.writes.length, 0)
        state.h.unmount()
    }
})

test('completed suppresses planning and legacy backfill preserves fetched fields', async () => {
    const complete = await setup({ branding: row({ meta: { onboardedAt: '2026-01-01' } }) })
    assert.equal(complete.render(), null)
    assert.equal(complete.writes.length, 0)
    complete.h.unmount()
    const legacy = await setup({ branding: row({ role: 'founder', knowledgeBase: { notes: 'Synthetic retained' } }) })
    assert.equal(legacy.render(), null)
    assert.equal(legacy.writes.length, 1)
    assert.equal(legacy.writes[0].data.data.knowledgeBase.notes, 'Synthetic retained')
    assert.ok(legacy.writes[0].data.data.meta.onboardedAt)
    legacy.h.unmount()
})

test('later normal successful loading clears failures and permits the deferred decision', async () => {
    const state = await setup({ branding: failed, strategy: failed })
    state.auth.isReady = false
    state.render()
    state.results.branding = missing
    state.results.strategy = missing
    state.auth.isReady = true
    assert.equal(state.render(), null)
    assert.equal((await state.settle()).type, 'modal')
    assert.equal(state.branding.loadFailed, false)
    assert.equal(state.strategy.loadFailed, false)
    assert.equal(state.reads.length, 4)
    state.h.unmount()
})

test('user switches invalidate readiness before effects and reset a completed or open decision', async () => {
    for (const completed of [true, false]) {
        const state = await setup({ branding: completed ? row({ meta: { onboardedAt: '2026-01-01' } }) : missing })
        state.auth.userId = 'synthetic-two'
        state.results.branding = failed
        assert.equal(state.render(), null, 'old profile/modal not exposed during the switching render')
        assert.equal(state.branding.isLoading, true)
        assert.equal(state.branding.updateBranding({ role: 'founder' }), false)
        assert.equal(await state.settle(), null)
        assert.equal(state.writes.length, 0)
        state.auth.userId = 'synthetic-three'
        state.results.branding = missing
        assert.equal(state.render(), null)
        assert.equal((await state.settle()).type, 'modal')
        state.h.unmount()
    }
})

test('cancelled old-user reads cannot overwrite the new account or emit stale toasts', async () => {
    let rejectOld
    const oldRead = new Promise((_resolve, reject) => (rejectOld = reject))
    const state = await setup({ branding: oldRead })
    state.auth.userId = 'synthetic-two'
    state.results.branding = row({ meta: { onboardedAt: '2026-01-01' }, profile: { name: 'Synthetic new user' } })
    await state.settle()
    rejectOld(new Error('Synthetic stale failure'))
    await state.settle()
    assert.equal(state.branding.branding.profile.name, 'Synthetic new user')
    assert.equal(state.branding.loadFailed, false)
    assert.equal(state.errors.length, 0)
    assert.equal(state.render(), null)
    state.h.unmount()
})

test('intentional draft survives read failure and later recovery keeps planning optional', async () => {
    const url = '/dashboard/editor?import=synthetic&from=tool_footer&activation=11111111-1111-4111-8111-111111111111'
    const state = await setup({ branding: failed, strategy: failed, url })
    assert.equal(state.render(), null)
    assert.ok(state.window.location.searchParams.get('import'))
    assert.equal(state.writes.length, 0)
    state.auth.isReady = false
    state.render()
    state.results.branding = missing
    state.results.strategy = missing
    state.auth.isReady = true
    assert.equal(await state.settle(), null)
    assert.ok(state.flow.readDraftFirst(state.auth.userId))
    state.window.dispatchEvent(new Event('lp-request-planning'))
    assert.equal(state.render().type, 'modal')
    assert.equal(state.writes.length, 0)
    state.h.unmount()
})
