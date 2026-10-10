import assert from 'node:assert/strict'
import test from 'node:test'
import { deflateRawSync } from 'node:zlib'

import { browser, hooks, loadTS, storage, tick } from './helpers/component-harness.mjs'

const entry = await loadTS('config/entry-sources.ts')
const doc = {
    type: 'doc',
    content: [
        {
            type: 'bulletList',
            content: [
                {
                    type: 'listItem',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Synthetic nested draft' }] }],
                },
            ],
        },
    ],
}
const encoded = deflateRawSync(JSON.stringify(doc)).toString('base64url')
const exposure = '11111111-1111-4111-8111-111111111111'
const importUrl = `https://preview.invalid/dashboard/editor?import=${encoded}&from=tool_footer&activation=${exposure}`
const json = (value) => JSON.parse(JSON.stringify(value))

async function activation(window, localStorage = storage(), sessionStorage = storage()) {
    return loadTS('lib/draft-first.ts', { '@/config/entry-sources': entry }, { window, localStorage, sessionStorage })
}

async function controller(url, opts = {}) {
    const window = browser(url)
    const localStorage = opts.localStorage ?? storage()
    const flow = await activation(window, localStorage)
    const h = hooks()
    const updates = []
    const events = []
    const branding = {
        meta: opts.completed ? { onboardedAt: '2026-01-01' } : {},
        role: opts.legacy ? 'founder' : '',
        profile: { name: '', headline: '', avatarUrl: '' },
    }
    let loading = opts.loading ?? false
    let cleared = 0
    const exports = await loadTS(
        'components/dashboard/onboarding/onboarding-controller.tsx',
        {
            'react': h.react,
            'react/jsx-runtime': h.jsx,
            'next/navigation': { useRouter: () => ({ replace: (href) => window.history.replaceState({}, '', href) }) },
            '@/config/entry-sources': entry,
            '@/config/linkedin': {
                ONBOARDING_LINKEDIN_STATUSES: ['connected', 'denied', 'error', 'session', 'unavailable'],
            },
            '@/config/routes': { Routes: { Dashboard: '/dashboard' } },
            '@/config/site': { site: {} },
            '@/lib/draft-first': flow,
            '@/lib/supabase/drafts': {},
            '@/lib/supabase/onboarding-session': {},
            '@/hooks/use-branding': {
                useBranding: () => ({ branding, isLoading: loading, updateBranding: (patch) => updates.push(patch) }),
            },
            '@/hooks/use-strategy': { useStrategy: () => ({ strategy: {}, isLoading: loading }) },
            '@/components/dashboard/auth-provider': {
                useAuth: () => ({ isReady: true, userId: 'synthetic-user', supabase: {} }),
            },
            './ai': { setEntrySource() {}, track: (...args) => events.push(args), postTextToDoc() {} },
            './debug-events': { onOnboardingDebug: () => () => {} },
            './onboarding-modal': { OnboardingModal: 'modal' },
            './types': {
                readOnboarding: () => opts.saved ?? null,
                clearOnboarding: () => cleared++,
                initialAnswers: () => ({}),
                persistOnboarding() {},
            },
        },
        { window, localStorage },
    )
    const render = () => h.render(exports.OnboardingController)
    render()
    return {
        render,
        window,
        flow,
        updates,
        events,
        localStorage,
        setReady: () => {
            loading = false
        },
        get cleared() {
            return cleared
        },
    }
}

test('actual controller defers imports without onboarding completion and survives reload/navigation', async () => {
    const first = await controller(importUrl)
    assert.equal(first.render(), null)
    assert.equal(first.updates.length, 0)
    assert.equal(first.flow.readDraftFirst('synthetic-user').exposureId, exposure)
    for (const path of ['/dashboard/editor?draft=synthetic', '/dashboard', '/dashboard/settings']) {
        const reloaded = await controller(`https://preview.invalid${path}`, { localStorage: first.localStorage })
        assert.equal(reloaded.render(), null)
        assert.equal(reloaded.updates.length, 0)
    }
})

test('optional planning request opens the real controller and preserves saved answers', async () => {
    const state = await controller(importUrl)
    state.window.dispatchEvent(new Event('lp-request-planning'))
    assert.equal(state.render().type, 'modal')
    assert.equal(state.render().props.startStepId, 'welcome')
    assert.equal(state.updates.length, 0)
})

test('explicit planning URL and existing planning placements override deferral', async () => {
    const first = await controller(importUrl)
    for (const path of [
        '/dashboard/editor?planning=1',
        '/dashboard?from=navbar',
        '/dashboard?from=plan_section',
        '/dashboard?from=mobile_nav_cta',
    ]) {
        const state = await controller(`https://preview.invalid${path}`, { localStorage: first.localStorage })
        assert.equal(state.render().type, 'modal', path)
    }
})

test('gate preserves saved planning, OAuth and checkout return precedence', async () => {
    const saved = {
        answers: { profile: { name: 'Synthetic', headline: '', avatarUrl: '' }, entrySource: 'tool_footer' },
        resumeAt: 'paywall',
    }
    for (const [suffix, expected] of [
        ['', 'paywall'],
        ['&linkedin=connected', 'fetching'],
        ['&linkedin=denied', 'connect'],
        ['&checkout=cancelled&source=onboarding', 'paywall'],
        ['&checkout=success&source=onboarding', 'paywall'],
    ]) {
        const state = await controller(importUrl + suffix, { saved })
        assert.equal(state.render().props.startStepId, expected)
        assert.equal(state.updates.length, 0)
    }
    for (const suffix of [
        '&linkedin=merge-prompt',
        '&checkout=success&source=upgrade',
        '&checkout=cancelled&source=upgrade',
    ]) {
        const state = await controller(importUrl + suffix, { saved })
        assert.equal(state.render(), null)
    }
})

test('controller snapshots returns before another consumer strips the URL', async () => {
    const saved = { answers: { profile: { name: '', headline: '', avatarUrl: '' } }, resumeAt: 'paywall' }
    const state = await controller(importUrl + '&checkout=success&source=upgrade', { saved, loading: true })
    state.window.history.replaceState({}, '', '/dashboard?from=billing_return')
    state.setReady()
    state.render()
    assert.equal(state.render(), null)
})

test('completed users stay completed; legacy backfill remains distinct from deferral', async () => {
    const saved = { answers: { profile: {} }, resumeAt: 'welcome' }
    const complete = await controller(importUrl, { completed: true, saved })
    assert.equal(complete.render(), null)
    assert.equal(complete.cleared, 1)
    const legacy = await controller(importUrl, { legacy: true })
    assert.equal(legacy.render(), null)
    assert.equal(legacy.updates.length, 1)
    assert.ok(legacy.updates[0].meta.onboardedAt)
})

test('account-scoped storage rejects corruption and tolerates blocked storage without leaking identities', async () => {
    const window = browser(importUrl)
    const store = storage()
    const flow = await activation(window, store)
    const choice = flow.deferPlanning('one', new URLSearchParams(window.location.search))
    assert.equal(flow.readDraftFirst('two'), null)
    assert.equal(flow.readDraftFirst('one').exposureId, choice.exposureId)
    flow.readDraftFirst(null)
    assert.deepEqual(json(flow.draftFirstProperties()), {})
    store.setItem('lp-draft-first:bad', '{broken')
    assert.equal(flow.readDraftFirst('bad'), null)
    const blocked = await activation(window, {
        getItem() {
            throw Error('blocked')
        },
        setItem() {
            throw Error('blocked')
        },
    })
    blocked.deferPlanning('one', new URLSearchParams(window.location.search))
    assert.equal(blocked.readDraftFirst('one').entrySource, 'tool_footer')
})

async function currentDraft(url, opts = {}) {
    const window = browser(url)
    const flow = await activation(window)
    const h = hooks()
    const writes = []
    const events = []
    const redirects = []
    const errors = []
    let draftsLoading = true
    const utils = await loadTS('lib/editor-utils.ts')
    const draftURL = await loadTS(
        'lib/draft-url.ts',
        {},
        { CompressionStream, DecompressionStream, TextEncoder, TextDecoder, btoa, atob },
    )
    const importer = await loadTS('lib/draft-import.ts', {
        '@/lib/draft-url': opts.draftURL ?? draftURL,
        '@/lib/draft-media': opts.mediaReader ?? { readDraftMedia: async () => opts.media ?? null },
    })
    const ai = await loadTS('components/dashboard/onboarding/ai.ts', {
        'posthog-js': { capture: (...args) => events.push(args) },
        '@/config/analytics': { OB_FUNNEL_VERSION: 'v3' },
        '@/lib/parse-formatted-text': { toTipTapParagraphs() {} },
        '@/lib/draft-first': flow,
        '@/lib/monthly-offer': {
            rememberOfferEntry() {},
            monthlyOfferProperties: () => opts.monthlyProperties ?? {},
        },
    })
    const currentHook = await loadTS(
        'hooks/use-current-draft.ts',
        {
            'react': h.react,
            'next/navigation': {
                useRouter: () => ({
                    replace: (href) => {
                        if (opts.routeError) throw opts.routeError
                        redirects.push(href)
                    },
                }),
                useSearchParams: () => new URLSearchParams(window.location.search),
            },
            'sonner': { toast: { error: (message) => errors.push(message) } },
            '@/config/entry-sources': entry,
            '@/lib/draft-first': flow,
            '@/lib/draft-import': importer,
            '@/lib/editor-utils': opts.utils ?? utils,
            '@/lib/supabase/drafts': {
                fetchDraft: async () => {
                    if (opts.fetchFail) throw Error('fetch')
                    return {
                        entry: { label: null, status: 'draft' },
                        content: { content: doc, media: opts.media ?? null },
                    }
                },
                deleteDraft: async (...args) => writes.push(['delete', ...args]),
                updateDraft: async (...args) => {
                    writes.push(['update', ...args])
                    await opts.waitForSave?.()
                    if (opts.saveFail) throw Error('save')
                },
            },
            '@/hooks/use-drafts': {
                useDrafts: () => ({
                    drafts: [],
                    isLoading: draftsLoading,
                    createDraft: async (content, options) => {
                        writes.push(['create', content, options])
                        opts.onCreate?.()
                        await opts.waitForCreate?.()
                        if (opts.createError) throw opts.createError
                        if (opts.createFail) throw Error('create')
                        await tick()
                        return { id: 'synthetic-draft', label: null, status: 'draft' }
                    },
                    updateDraft: async (...args) => {
                        writes.push(['update', ...args])
                        await opts.waitForSave?.()
                        return !opts.saveFail
                    },
                    purgeEmptyDrafts() {},
                }),
            },
            '@/components/dashboard/auth-provider': {
                useAuth: () => ({ isReady: true, userId: opts.user?.id ?? 'synthetic-user', supabase: {} }),
            },
            '@/components/dashboard/onboarding/ai': ai,
        },
        { window, ...opts.globals },
    )
    const render = () => h.render(currentHook.useCurrentDraft)
    render()
    draftsLoading = false
    render()
    await new Promise((resolve) => setTimeout(resolve, 30))
    return { render, h, flow, writes, redirects, events, errors, window }
}

test('actual import hook deduplicates overlapping loads and preserves nested text, media and attribution', async () => {
    const media = { type: 'image', src: 'data:image/png;base64,synthetic' }
    const state = await currentDraft(importUrl + '&m=synthetic-media', { media })
    assert.equal(state.writes.filter(([kind]) => kind === 'create').length, 1)
    assert.deepEqual(json(state.render().initialContent), doc)
    assert.deepEqual(json(state.render().initialMedia), media)
    assert.equal(
        state.events.filter(([event, props]) => event === 'draft_import_result' && props.outcome === 'success').length,
        1,
    )
    assert.match(state.redirects[0], /from=tool_footer/)
    assert.match(state.redirects[0], new RegExp(exposure))
    assert.doesNotMatch(state.redirects[0], /[?&](import|m)=/)
    state.h.unmount()
    assert.equal(state.writes.filter(([kind]) => kind === 'delete').length, 0)
})

test('malformed imports and missing media never create a blank or overwrite existing drafts', async () => {
    for (const url of [importUrl.replace(encoded, 'broken'), importUrl + '&m=expired']) {
        const state = await currentDraft(url)
        assert.equal(state.writes.length, 0)
        assert.equal(state.redirects.length, 0)
        assert.equal(state.render().draftId, null)
        assert.equal(
            state.events.filter(([event, props]) => event === 'draft_import_result' && props.outcome === 'failure')
                .length,
            1,
        )
        state.h.unmount()
        assert.equal(state.writes.length, 0)
    }
})

test('failed create/load cannot count successful import or trigger empty-draft deletion', async () => {
    const failed = await currentDraft(importUrl, { createFail: true })
    assert.equal(
        failed.events.filter(([event, props]) => event === 'draft_import_result' && props.outcome === 'success').length,
        0,
    )
    failed.h.unmount()
    assert.equal(failed.writes.filter(([kind]) => kind === 'delete').length, 0)
    const load = await currentDraft('https://preview.invalid/dashboard/editor?draft=existing', { fetchFail: true })
    load.h.unmount()
    assert.equal(load.writes.filter(([kind]) => kind === 'delete').length, 0)
})

const importEvents = (state) => state.events.filter(([event]) => event === 'draft_import_result')
const sensitive = 'Synthetic secret token=do-not-capture email=fixture@example.invalid https://private.invalid/media'

test('known import failure boundaries retain only finite diagnostics and unchanged enrollment fields', async (t) => {
    const invalidDoc = deflateRawSync(JSON.stringify({ type: 'doc', content: [{ type: 'text', text: 123 }] })).toString(
        'base64url',
    )
    const realMedia = await loadTS('lib/draft-media.ts')
    const monthlyProperties = {
        enrollment_id: '00000000-0000-4000-8000-000000000009',
        cohort_id: 'exp9_monthly_first_v2',
        eligibility_at: '2026-10-07T09:00:00.000Z',
        entry_source: 'navbar',
    }
    for (const [name, url, opts, stage, creates] of [
        ['malformed decode', importUrl.replace(encoded, 'broken'), {}, 'decode_validation', 0],
        ['invalid document', importUrl.replace(encoded, invalidDoc), {}, 'decode_validation', 0],
        [
            'decode exception',
            importUrl,
            {
                draftURL: {
                    decodeDraft: async () => {
                        throw sensitive
                    },
                },
            },
            'decode_validation',
            0,
        ],
        ['unavailable media', importUrl + '&m=synthetic-unavailable', { mediaReader: realMedia }, 'media_read', 0],
        [
            'media exception',
            importUrl + '&m=synthetic-media',
            {
                mediaReader: {
                    readDraftMedia: async () => {
                        throw sensitive
                    },
                },
            },
            'media_read',
            0,
        ],
        ['create rejection', importUrl, { createError: new Error(sensitive) }, 'create', 1],
        ['create primitive rejection', importUrl, { createError: sensitive }, 'create', 1],
        [
            'post-create extraction',
            importUrl,
            {
                utils: {
                    extractPlainText: () => {
                        throw sensitive
                    },
                },
            },
            'post_create',
            1,
        ],
    ]) {
        await t.test(name, async () => {
            const state = await currentDraft(url, { ...opts, monthlyProperties })
            const captured = importEvents(state)
            assert.equal(captured.length, 1)
            const props = captured[0][1]
            assert.equal(props.outcome, 'failure')
            assert.equal(props.error_code, 'decode_media_or_create')
            assert.equal(props.diagnostic_schema_version, 1)
            assert.equal(props.failure_stage, stage)
            assert.equal(props.create_resolved, stage === 'post_create')
            assert.equal(props.enrollment_id, monthlyProperties.enrollment_id)
            assert.equal(props.cohort_id, monthlyProperties.cohort_id)
            assert.equal(props.eligibility_at, monthlyProperties.eligibility_at)
            assert.equal(props.entry_source, 'navbar')
            assert.equal(props.draft_enrollment_id, exposure)
            assert.equal(props.draft_cohort_id, 'exp10_draft_first_v1')
            assert.equal(props.draft_entry_source, 'tool_footer')
            assert.equal(props.draft_eligibility_at, state.flow.readDraftFirst('synthetic-user').eligibilityAt ?? null)
            assert.equal(props.schema_version, 1, 'existing enrollment schema is unchanged')
            assert.ok(!JSON.stringify(props).includes(sensitive))
            assert.ok(!('draft_id' in props) && !('has_media' in props))
            assert.equal(state.writes.filter(([kind]) => kind === 'create').length, creates)
            assert.equal(state.redirects.length, 0)
            assert.equal(state.errors.length, 1)
            assert.equal(state.render().draftId, null)
            state.h.unmount()
            assert.equal(state.writes.length, creates, 'no extra save/create/delete on failed import cleanup')
        })
    }
})

test('post-create routing exception preserves prior success capture and is not evidence of missing persistence', async () => {
    const state = await currentDraft(importUrl, { routeError: new Error(sensitive) })
    const captured = importEvents(state)
    assert.equal(captured.length, 2, 'the existing success then failure emission points are preserved')
    assert.equal(captured[0][1].outcome, 'success')
    assert.equal(captured[0][1].draft_id, 'synthetic-draft')
    assert.equal(captured[0][1].has_media, false)
    assert.ok(!('failure_stage' in captured[0][1]) && !('create_resolved' in captured[0][1]))
    assert.equal(captured[1][1].failure_stage, 'post_create')
    assert.equal(captured[1][1].create_resolved, true)
    assert.equal(state.flow.readDraftFirst('synthetic-user').draftId, 'synthetic-draft')
    assert.equal(state.writes.length, 1)
    assert.ok(!JSON.stringify(captured).includes(sensitive))
    state.h.unmount()
    assert.equal(state.writes.length, 1)
})

test('create rejection after a synthetic write reports unobserved resolution, not absence of persistence', async () => {
    let syntheticCommitted = false
    const state = await currentDraft(importUrl, {
        onCreate: () => {
            syntheticCommitted = true
        },
        createError: new Error(sensitive),
    })
    assert.equal(syntheticCommitted, true)
    assert.equal(importEvents(state).length, 1)
    assert.equal(importEvents(state)[0][1].failure_stage, 'create')
    assert.equal(importEvents(state)[0][1].create_resolved, false)
    assert.equal(state.writes.length, 1)
    state.h.unmount()
    assert.equal(state.writes.length, 1)
})

test('unestablished boundary falls back to unknown without inspecting generic exception text', async () => {
    class UnknownBoundaryParams extends URLSearchParams {
        get(key) {
            if (key === 'm') throw new Error(sensitive)
            return super.get(key)
        }
    }
    const state = await currentDraft(importUrl, { globals: { URLSearchParams: UnknownBoundaryParams } })
    const captured = importEvents(state)
    assert.equal(captured.length, 2, 'both pre-await overlapping failures retain existing emission behavior')
    for (const [, props] of captured) {
        assert.equal(props.outcome, 'failure')
        assert.equal(props.error_code, 'decode_media_or_create')
        assert.equal(props.failure_stage, 'unknown')
        assert.equal(props.create_resolved, false)
        assert.equal(props.diagnostic_schema_version, 1)
        assert.ok(!JSON.stringify(props).includes(sensitive))
    }
    assert.equal(state.writes.length, 0)
    state.h.unmount()
    const importer = await loadTS('lib/draft-import.ts', { '@/lib/draft-url': {}, '@/lib/draft-media': {} })
    assert.deepEqual(json(importer.draftImportFailureProperties()), {
        diagnostic_schema_version: 1,
        failure_stage: 'unknown',
        create_resolved: false,
    })
    assert.deepEqual(
        json(
            importer.draftImportFailureProperties({
                failure_stage: sensitive,
                create_resolved: sensitive,
                raw: sensitive,
            }),
        ),
        {
            diagnostic_schema_version: 1,
            failure_stage: 'unknown',
            create_resolved: false,
        },
    )
})

test('stale resolved/rejected imports keep one create and cannot capture or replace the newer load', async (t) => {
    for (const createError of [undefined, new Error(sensitive)]) {
        await t.test(createError ? 'reject' : 'resolve', async () => {
            let resolveCreate
            const pending = new Promise((resolve) => (resolveCreate = resolve))
            const state = await currentDraft(importUrl, { waitForCreate: () => pending, createError })
            assert.equal(state.writes.length, 1)
            assert.equal(importEvents(state).length, 0)
            state.window.history.replaceState({}, '', '/dashboard/editor?draft=other')
            state.render()
            await tick()
            assert.equal(state.render().draftId, 'other')
            resolveCreate()
            await tick()
            await tick()
            assert.equal(state.render().draftId, 'other')
            assert.equal(importEvents(state).length, 0)
            assert.equal(state.errors.length, 0)
            assert.equal(state.redirects.length, 0)
            assert.equal(state.writes.length, 1)
            state.h.unmount()
            assert.equal(state.writes.length, 1)
        })
    }
})

function elements(node) {
    if (!node || typeof node !== 'object') return []
    if (Array.isArray(node)) return node.flatMap(elements)
    return [node, ...elements(node.props?.children)]
}

test('actual editor counts meaningful use after hydration and preserves edits across mobile remounts', async () => {
    const h = hooks()
    const window = browser(importUrl)
    const flow = await activation(window)
    const choice = flow.deferPlanning('synthetic-user', new URLSearchParams(window.location.search))
    flow.writeDraftFirst('synthetic-user', { ...choice, draftId: 'one' })
    const events = []
    const copies = []
    let desktop = true
    let draft = { draftId: 'one', initialContent: doc, initialMedia: null, isLoading: false, saveContent() {} }
    const utils = await loadTS('lib/editor-utils.ts')
    const editorComponent = await loadTS(
        'components/dashboard/dashboard-editor.tsx',
        {
            'react': h.react,
            'react/jsx-runtime': h.jsx,
            'next/dynamic': { default: () => 'editor', __esModule: true },
            'lucide-react': { BarChart3: 'icon', CopyIcon: 'icon', Eye: 'icon', PenLine: 'icon' },
            'react-resizable-panels': { Group: 'group', Panel: 'panel' },
            'sonner': { toast: { success() {} } },
            '@/lib/ai-branding': { assembleBrandingContext() {}, brandingRulesForGenerate: () => ({}) },
            '@/lib/draft-first': flow,
            '@/lib/draft-media': {},
            '@/lib/draft-url': {},
            '@/lib/editor-utils': utils,
            '@/lib/utils': { cn: (...args) => args.join(' ') },
            '@/hooks/use-branding': { useBranding: () => ({ branding: { profile: {} } }) },
            '@/hooks/use-current-draft': { useCurrentDraft: () => draft },
            '@/hooks/use-is-desktop': { useIsDesktop: () => desktop },
            '@/hooks/use-plan': { usePlan: () => ({ isPaid: false }) },
            '@/components/dashboard/auth-provider': { useAuth: () => ({ userId: 'synthetic-user' }) },
            '@/components/dashboard/onboarding/ai': { track: (...args) => events.push(args) },
            '@/components/dashboard/upgrade-provider': { useUpgradePrompt: () => ({ openUpgrade() {} }) },
            '@/components/ui/button': { Button: 'button' },
            '@/components/ui/skeleton': {},
            '@/components/dashboard/ai-actions': {},
            '@/components/dashboard/label-picker': {},
            '@/components/dashboard/publish-controls': {},
            '@/components/dashboard/status-picker': {},
            '@/components/tool/editor-loading': {},
            '@/components/tool/preview/preview-panel': { PreviewPanel: 'preview' },
            '@/components/tool/resize-handle': {},
            './analyze/analyze-panel': {},
            './page-header': { PageHeader: 'header' },
        },
        { window, navigator: { clipboard: { writeText: async (text) => copies.push(text) } } },
    )
    const render = () => h.render(editorComponent.DashboardEditor)
    const editor = () => elements(render()).find((node) => node.type === 'editor')
    render()
    const normalized = { ...doc, attrs: {} }
    editor().props.onChange(normalized)
    render()
    assert.equal(events.filter(([event]) => event === 'draft_meaningful_use').length, 0)
    const edited = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Synthetic edited draft' }] }],
    }
    editor().props.onChange(edited)
    render()
    assert.equal(events.filter(([event]) => event === 'draft_meaningful_use').length, 0)
    desktop = false
    assert.deepEqual(json(editor().props.initialContent), edited)
    const copy = elements(render()).find((node) => node.type === 'button' && node.props.children?.[1] === 'Copy Text')
    await copy.props.onClick()
    assert.deepEqual(copies, ['Synthetic edited draft'])
    editor().props.onCopyText()
    assert.equal(events.filter(([event]) => event === 'draft_meaningful_use').length, 1)
    draft = { ...draft, draftId: 'two', initialContent: doc }
    assert.deepEqual(json(editor().props.initialContent), doc)
})

test('actual free-tool handoff records eligibility before encoding, carries media, and preserves explicit planning', async () => {
    const h = hooks()
    const window = browser('https://preview.invalid/')
    const timeline = []
    const utils = await loadTS('lib/editor-utils.ts')
    const tool = await loadTS(
        'components/tool/tool.tsx',
        {
            'react': h.react,
            'react/jsx-runtime': h.jsx,
            'next/dynamic': { default: () => 'editor', __esModule: true },
            'lucide-react': { ArrowUpRight: 'icon', Eye: 'icon', PenLine: 'icon' },
            'posthog-js': { default: { capture: (event) => timeline.push(event) }, __esModule: true },
            'react-resizable-panels': { Group: 'group', Panel: 'panel' },
            'sonner': { toast: Object.assign(() => {}, { error: (message) => timeline.push(message) }) },
            '@/config/entry-sources': entry,
            '@/config/routes': { Routes: { Dashboard: '/dashboard' } },
            '@/lib/draft-first': await activation(window),
            '@/lib/draft-media': { putDraftMedia: async () => 'synthetic-media', pruneDraftMedia() {} },
            '@/lib/draft-url': {
                decodeDraft: async () => null,
                encodeDraft: async () => {
                    timeline.push('encode')
                    return encoded
                },
            },
            '@/lib/editor-utils': utils,
            '@/lib/utils': { cn: (...args) => args.join(' ') },
            '@/hooks/use-draft-persistence': {
                useDraftPersistence: () => ({ flush() {} }),
                readStoredDraft: () => doc,
            },
            '@/hooks/use-is-desktop': { useIsDesktop: () => true },
            '@/components/ui/button': { Button: 'button' },
            './editor-loading': {},
            './preview/preview-panel': { PreviewPanel: 'preview' },
            './resize-handle': { ResizeHandle: 'resize' },
        },
        { window, localStorage: storage(), document: { querySelector: () => null } },
    )
    const render = () => h.render(() => tool.Tool({}))
    render()
    await tick()
    const editor = elements(render()).find((node) => node.type === 'editor')
    editor.props.onChange(doc)
    editor.props.onMediaChange({ type: 'image', src: 'synthetic' })
    const buttons = elements(render()).filter((node) => node.type === 'button')
    const continueDraft = buttons.find(
        (node) =>
            elements(node).some((child) => child.props?.children === 'Continue my draft') ||
            node.props.children?.[0] === 'Continue my draft',
    )
    assert.ok(continueDraft)
    await continueDraft.props.onClick()
    assert.ok(timeline.indexOf('draft_first_eligible') < timeline.indexOf('encode'))
    assert.equal(window.location.searchParams.get('import'), encoded)
    assert.equal(window.location.searchParams.get('m'), 'synthetic-media')
    assert.equal(window.location.searchParams.get('from'), 'tool_footer')
    assert.ok(window.location.searchParams.get('activation'))
    const plan = buttons.find((node) => node.props.children === 'Create my LinkedIn plan')
    await plan.props.onClick()
    assert.equal(window.location.searchParams.get('planning'), '1')
    assert.equal(timeline.filter((event) => event === 'draft_first_eligible').length, 1)
})

test('pre-auth eligibility clock and enrollment survive binding and never reset on another attempt', async () => {
    const window = browser(importUrl)
    const local = storage()
    const session = storage()
    const before = await activation(window, local, session)
    const pending = before.prepareDraftFirst('tool_footer', exposure)
    const after = await activation(window, local, session)
    const bound = after.deferPlanning('synthetic-user', new URLSearchParams(window.location.search))
    assert.equal(bound.eligibilityAt, pending.eligibilityAt)
    assert.equal(after.draftFirstProperties(bound).enrollment_id, exposure)
    const again = after.deferPlanning(
        'synthetic-user',
        new URLSearchParams('from=tool_nudge&activation=22222222-2222-4222-8222-222222222222'),
    )
    assert.equal(again.eligibilityAt, pending.eligibilityAt)
    assert.equal(again.exposureId, exposure)
    assert.equal(again.entrySource, 'tool_footer')
})

test('meaningful edit requires confirmed persistence, failed saves and hydration cannot count success', async () => {
    for (const saveFail of [true, false]) {
        const state = await currentDraft(importUrl, { saveFail })
        const hook = state.render()
        hook.saveContent(doc)
        await hook.flush()
        assert.equal(state.events.filter(([event]) => event === 'draft_meaningful_use').length, 0)
        hook.saveContent({ ...doc, attrs: { edited: true } }, true)
        assert.equal(state.events.filter(([event]) => event === 'draft_meaningful_use').length, 0)
        await hook.flush()
        const uses = state.events.filter(([event]) => event === 'draft_meaningful_use')
        assert.equal(uses.length, 1)
        assert.equal(uses[0][1].outcome, saveFail ? 'failure' : 'success')
        assert.equal(uses[0][1].action, 'saved_edit')
        assert.equal(!!state.flow.readDraftFirst('synthetic-user').used, !saveFail)
        state.h.unmount()
    }
})

const useEvents = (state) => state.events.filter(([event]) => event === 'draft_meaningful_use')

async function leaveDraft(state, path) {
    if (path === 'unmount') {
        state.h.unmount()
    } else {
        state.window.history.replaceState({}, '', '/dashboard/editor?draft=other')
        state.render()
    }
    await tick()
}

test('navigation saves record only confirmed meaningful edits, excluding failure and hydration', async (t) => {
    for (const path of ['unmount', 'switch']) {
        for (const meaningful of [true, false]) {
            for (const saveFail of [true, false]) {
                await t.test(`${path}: meaningful=${meaningful}, failure=${saveFail}`, async () => {
                    let resolveSave
                    const pending = new Promise((resolve) => (resolveSave = resolve))
                    const state = await currentDraft(importUrl, { saveFail, waitForSave: () => pending })
                    state.render().saveContent({ ...doc, attrs: { edited: true } }, meaningful)
                    state.render()
                    await leaveDraft(state, path)
                    assert.equal(state.writes.filter(([kind]) => kind === 'update').length, 1)
                    assert.equal(useEvents(state).length, 0, 'not successful until persistence resolves')
                    resolveSave()
                    await tick()
                    const uses = useEvents(state)
                    assert.equal(uses.length, meaningful ? 1 : 0)
                    if (meaningful) assert.equal(uses[0][1].outcome, saveFail ? 'failure' : 'success')
                    assert.equal(!!state.flow.readDraftFirst('synthetic-user').used, meaningful && !saveFail)
                    if (path === 'switch') {
                        const next = state.render()
                        assert.equal(next.draftId, 'other')
                        next.saveContent(doc)
                        await next.flush()
                        assert.equal(useEvents(state).length, meaningful ? 1 : 0, 'new draft hydration is excluded')
                        state.h.unmount()
                    }
                })
            }
        }
    }
})

test('navigation successes deduplicate against earlier save or copy and remain draft scoped', async (t) => {
    for (const path of ['unmount', 'switch']) {
        for (const earlier of ['save', 'copy', 'different_draft']) {
            await t.test(`${path} after ${earlier}`, async () => {
                const state = await currentDraft(importUrl)
                const hook = state.render()
                if (earlier === 'save') {
                    hook.saveContent(doc, true)
                    await hook.flush()
                } else if (earlier === 'copy') {
                    const choice = state.flow.readDraftFirst('synthetic-user')
                    state.flow.writeDraftFirst('synthetic-user', { ...choice, used: true })
                } else {
                    const choice = state.flow.readDraftFirst('synthetic-user')
                    state.flow.writeDraftFirst('synthetic-user', { ...choice, draftId: 'other' })
                }
                hook.saveContent({ ...doc, attrs: { edited: true } }, true)
                state.render()
                await leaveDraft(state, path)
                assert.equal(useEvents(state).length, earlier === 'save' ? 1 : 0)
                if (path === 'switch') state.h.unmount()
            })
        }
    }
})

test('save accounting snapshots meaningful intent before asynchronous hydration changes', async () => {
    let resolveSave
    const pending = new Promise((resolve) => (resolveSave = resolve))
    const state = await currentDraft(importUrl, { waitForSave: () => pending })
    const hook = state.render()
    hook.saveContent(doc, true)
    const saving = hook.flush()
    hook.saveContent(doc, false)
    resolveSave()
    await saving
    assert.equal(useEvents(state).length, 1)
    assert.equal(useEvents(state)[0][1].outcome, 'success')
    state.render()
    state.h.unmount()
    await tick()
    assert.equal(useEvents(state).length, 1)
})

test('debounced persistence uses the same success/failure accounting and captures account scope', async (t) => {
    for (const saveFail of [true, false]) {
        await t.test(`failure=${saveFail}`, async () => {
            let timer
            let resolveSave
            const pending = new Promise((resolve) => (resolveSave = resolve))
            const user = { id: 'synthetic-user' }
            const state = await currentDraft(importUrl, {
                user,
                saveFail,
                waitForSave: () => pending,
                globals: {
                    setTimeout: (fn) => (timer = fn),
                    clearTimeout: () => (timer = undefined),
                },
            })
            state.render().saveContent(doc, true)
            timer()
            assert.equal(useEvents(state).length, 0)
            user.id = 'different-user'
            state.render()
            const choice = state.flow.readDraftFirst('synthetic-user')
            state.flow.writeDraftFirst(user.id, { ...choice })
            resolveSave()
            await tick()
            assert.equal(useEvents(state).length, 1)
            assert.equal(useEvents(state)[0][1].outcome, saveFail ? 'failure' : 'success')
            assert.equal(!!state.flow.readDraftFirst('synthetic-user').used, !saveFail)
            assert.equal(!!state.flow.readDraftFirst(user.id).used, false)
            state.h.unmount()
            await tick()
        })
    }
})
