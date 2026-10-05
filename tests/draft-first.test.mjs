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

async function activation(window, localStorage = storage()) {
    return loadTS('lib/draft-first.ts', { '@/config/entry-sources': entry }, { window, localStorage })
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
        '@/lib/draft-url': draftURL,
        '@/lib/draft-media': { readDraftMedia: async () => opts.media ?? null },
    })
    const currentHook = await loadTS(
        'hooks/use-current-draft.ts',
        {
            'react': h.react,
            'next/navigation': {
                useRouter: () => ({ replace: (href) => redirects.push(href) }),
                useSearchParams: () => new URLSearchParams(window.location.search),
            },
            'sonner': { toast: { error: (message) => errors.push(message) } },
            '@/config/entry-sources': entry,
            '@/lib/draft-first': flow,
            '@/lib/draft-import': importer,
            '@/lib/editor-utils': utils,
            '@/lib/supabase/drafts': {
                fetchDraft: async () => {
                    if (opts.fetchFail) throw Error('fetch')
                    return {
                        entry: { label: null, status: 'draft' },
                        content: { content: doc, media: opts.media ?? null },
                    }
                },
                deleteDraft: async (...args) => writes.push(['delete', ...args]),
                updateDraft: async (...args) => writes.push(['update', ...args]),
            },
            '@/hooks/use-drafts': {
                useDrafts: () => ({
                    drafts: [],
                    isLoading: draftsLoading,
                    createDraft: async (content, options) => {
                        writes.push(['create', content, options])
                        if (opts.createFail) throw Error('create')
                        await tick()
                        return { id: 'synthetic-draft', label: null, status: 'draft' }
                    },
                    updateDraft: async (...args) => writes.push(['update', ...args]),
                    purgeEmptyDrafts() {},
                }),
            },
            '@/components/dashboard/auth-provider': {
                useAuth: () => ({ isReady: true, userId: 'synthetic-user', supabase: {} }),
            },
            '@/components/dashboard/onboarding/ai': { setEntrySource() {}, track: (...args) => events.push(args) },
        },
        { window },
    )
    const render = () => h.render(currentHook.useCurrentDraft)
    render()
    draftsLoading = false
    render()
    await new Promise((resolve) => setTimeout(resolve, 30))
    return { render, h, flow, writes, redirects, events, errors }
}

test('actual import hook deduplicates overlapping loads and preserves nested text, media and attribution', async () => {
    const media = { type: 'image', src: 'data:image/png;base64,synthetic' }
    const state = await currentDraft(importUrl + '&m=synthetic-media', { media })
    assert.equal(state.writes.filter(([kind]) => kind === 'create').length, 1)
    assert.deepEqual(json(state.render().initialContent), doc)
    assert.deepEqual(json(state.render().initialMedia), media)
    assert.equal(state.events.filter(([event]) => event === 'draft_first_import_succeeded').length, 1)
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
        assert.equal(state.events.filter(([event]) => event === 'draft_first_import_failed').length, 1)
        state.h.unmount()
        assert.equal(state.writes.length, 0)
    }
})

test('failed create/load cannot count successful import or trigger empty-draft deletion', async () => {
    const failed = await currentDraft(importUrl, { createFail: true })
    assert.equal(failed.events.filter(([event]) => event === 'draft_first_import_succeeded').length, 0)
    failed.h.unmount()
    assert.equal(failed.writes.filter(([kind]) => kind === 'delete').length, 0)
    const load = await currentDraft('https://preview.invalid/dashboard/editor?draft=existing', { fetchFail: true })
    load.h.unmount()
    assert.equal(load.writes.filter(([kind]) => kind === 'delete').length, 0)
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
    assert.equal(events.filter(([event]) => event === 'draft_first_used').length, 0)
    const edited = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Synthetic edited draft' }] }],
    }
    editor().props.onChange(edited)
    render()
    assert.equal(events.filter(([event]) => event === 'draft_first_used').length, 1)
    desktop = false
    assert.deepEqual(json(editor().props.initialContent), edited)
    const copy = elements(render()).find((node) => node.type === 'button' && node.props.children?.[1] === 'Copy Text')
    await copy.props.onClick()
    assert.deepEqual(copies, ['Synthetic edited draft'])
    editor().props.onCopyText()
    assert.equal(events.filter(([event]) => event === 'draft_first_used').length, 1)
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
            '@/lib/draft-first': { ACTIVATION_PARAM: 'activation', DRAFT_FIRST_VERSION: 'imported_draft_v1' },
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
