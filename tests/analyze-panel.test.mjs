import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { parseHTML } from 'linkedom'
import { createRoot } from 'react-dom/client'
import ts from 'typescript'

import { analysisSchema } from '../app/api/analyze/route.schema.ts'

function load(path, mocks, fetch) {
    const compiled = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), {
        compilerOptions: {
            esModuleInterop: true,
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
        },
        fileName: path,
    }).outputText
    const loaded = { exports: {} }
    runInNewContext(compiled, {
        exports: loaded.exports,
        module: loaded,
        fetch,
        require(name) {
            if (name === 'react') return React
            if (name === 'react/jsx-runtime') return jsxRuntime
            assert.ok(name in mocks, `Missing AnalyzePanel mock: ${name}`)
            return mocks[name]
        },
    })
    return loaded.exports
}

const analysis = {
    score: 75,
    hook_score: 70,
    readability_score: 80,
    cta_score: 65,
    engagement_score: 7,
    strengths: ['Clear message'],
    improvements: ['Add a question'],
    topics: ['Writing'],
    sentiment: 'positive',
    category: 'educational',
    tone: 'professional',
    has_hook: true,
    has_cta: false,
    hook_quality: 'strong',
}
const suggestion = { text: 'Ask the reader a specific question.', type: 'engagement' }
const success = () => Response.json({ success: true, analysis })
function deferred() {
    let resolve, reject
    const promise = new Promise((yes, no) => {
        resolve = yes
        reject = no
    })
    return { promise, resolve, reject }
}

async function mount(t, responses, contentText = 'A controlled draft for analysis.') {
    const { window } = parseHTML('<html><body><div id="root"></div></body></html>')
    globalThis.window = window
    globalThis.document = window.document
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    const errors = [],
        events = [],
        calls = [],
        applied = []
    const fetch = async (url, options) => {
        calls.push({ url, body: JSON.parse(options.body) })
        assert.ok(responses[url]?.length, `Unexpected request: ${url}`)
        const next = responses[url].shift()
        if (next instanceof Error) throw next
        return typeof next === 'function' ? next() : next
    }
    const ApiRoutes = { Analyze: '/api/analyze', Suggestions: '/api/suggestions', Generate: '/api/generate' }
    const { fetchSuggestions } = load('lib/ai-suggestions.ts', { '@/config/routes': { ApiRoutes } }, fetch)
    const icon = () => null
    const { AnalyzePanel } = load(
        'components/dashboard/analyze/analyze-panel.tsx',
        {
            'lucide-react': Object.fromEntries(
                ['BarChart3', 'CheckCircle', 'ChevronRight', 'Loader2', 'RefreshCw', 'Sparkles', 'XCircle'].map(
                    (name) => [name, icon],
                ),
            ),
            'posthog-js': { capture: (...args) => events.push(args) },
            'sonner': { toast: { error: (text) => errors.push(text), success() {} } },
            '@/config/routes': { ApiRoutes },
            '@/lib/ai-suggestions': { fetchSuggestions },
            '@/lib/analyze-utils': {
                formatCategory: (s) => s,
                sentimentColor: () => '',
                suggestionTypeColor: () => '',
            },
            '@/lib/post-analytics': { getPostAnalytics: () => ({ content_length: contentText.length }) },
            '@/lib/utils': { cn: (...args) => args.filter(Boolean).join(' ') },
            '@/components/ui/button': {
                Button: ({ children, ...props }) => React.createElement('button', props, children),
            },
            '@/components/ui/skeleton': { Skeleton: () => React.createElement('div', { 'data-skeleton': true }) },
            './circular-gauge': { CircularGauge: ({ score }) => React.createElement('output', null, score) },
            './stats-section': { StatsSection: () => null },
            './sub-score': { SubScore: () => null },
            '@/app/api/analyze/route.schema': { analysisSchema },
        },
        fetch,
    )
    const root = createRoot(window.document.getElementById('root'))
    await React.act(async () => {
        root.render(
            React.createElement(AnalyzePanel, {
                content: {},
                contentText,
                hasImage: false,
                brandingContext: '',
                onApplySuggestion: (text) => applied.push(text),
            }),
        )
    })
    t.after(async () => {
        await React.act(async () => root.unmount())
        delete globalThis.window
        delete globalThis.document
        delete globalThis.IS_REACT_ACT_ENVIRONMENT
    })
    const button = () => window.document.querySelector('button')
    const click = async (element = button()) => {
        await React.act(async () => {
            element.dispatchEvent(new window.Event('click', { bubbles: true }))
        })
    }
    return {
        errors,
        events,
        calls,
        applied,
        button,
        click,
        text: () => window.document.body.textContent,
        skeletons: () => window.document.querySelectorAll('[data-skeleton]').length,
        suggestionCalls: () => calls.filter(({ url }) => url === ApiRoutes.Suggestions).length,
        applyButton: () => [...window.document.querySelectorAll('button')].find((b) => b.textContent === 'Apply'),
    }
}

const failures = [
    ['504 JSON', () => Response.json({ error: 'Controlled timeout' }, { status: 504 }), 'Controlled timeout'],
    ['504 HTML', () => new Response('<h1>Gateway Timeout</h1>', { status: 504 }), 'Analysis failed'],
    [
        '401 authorization',
        () => Response.json({ error: 'Authentication required' }, { status: 401 }),
        'Authentication required',
    ],
    ['403 authorization', () => Response.json({ error: 'Forbidden' }, { status: 403 }), 'Forbidden'],
    [
        '429 rate limit',
        () => Response.json({ error: 'Daily analysis limit reached' }, { status: 429 }),
        'Daily analysis limit reached',
    ],
    [
        'network rejection',
        () => {
            throw new Error('Controlled network failure')
        },
        'Failed to analyze post',
    ],
    ['invalid success JSON', () => new Response('not JSON'), 'Failed to analyze post'],
    ['missing analysis', () => Response.json({ success: true }), 'Failed to analyze post'],
    ['null analysis', () => Response.json({ success: true, analysis: null }), 'Failed to analyze post'],
    ['partial analysis', () => Response.json({ success: true, analysis: { score: 75 } }), 'Failed to analyze post'],
    ['false success', () => Response.json({ success: false, analysis }), 'Failed to analyze post'],
]
for (const [name, response, error] of failures) {
    test(`${name}: loading settles, no suggestions request, retry succeeds`, async (t) => {
        const ui = await mount(t, {
            '/api/analyze': [response, success],
            '/api/suggestions': [Response.json({ suggestions: [suggestion] })],
        })
        await ui.click()
        assert.equal(ui.button().disabled, false)
        assert.equal(ui.skeletons(), 0)
        assert.equal(ui.suggestionCalls(), 0)
        assert.deepEqual(ui.errors, [error])
        assert.equal(ui.events.length, 0)
        await ui.click()
        assert.equal(ui.button().disabled, false)
        assert.equal(ui.skeletons(), 0)
        assert.equal(ui.suggestionCalls(), 1)
        assert.match(ui.text(), /75/)
        assert.match(ui.text(), /Ask the reader/)
        assert.equal(ui.events[0][0], 'post_analyzed_panel')
    })
}

test('empty draft does not start either request', async (t) => {
    const ui = await mount(t, {}, '   ')
    await ui.click()
    assert.equal(ui.calls.length, 0)
    assert.equal(ui.skeletons(), 0)
    assert.deepEqual(ui.errors, ['Write something first before analyzing'])
})

test('analysis displays while suggestions remain pending, then successful suggestions apply', async (t) => {
    const pendingAnalysis = deferred(),
        pendingSuggestions = deferred()
    const ui = await mount(t, {
        '/api/analyze': [pendingAnalysis.promise],
        '/api/suggestions': [pendingSuggestions.promise],
        '/api/generate': [Response.json({ result: 'Revised controlled draft.' })],
    })
    await ui.click()
    assert.equal(ui.button().disabled, true)
    assert.equal(ui.suggestionCalls(), 0)
    await React.act(async () => pendingAnalysis.resolve(success()))
    assert.equal(ui.button().disabled, false)
    assert.match(ui.text(), /75/)
    assert.equal(ui.suggestionCalls(), 1)
    assert.equal(ui.skeletons(), 3)
    await React.act(async () => pendingSuggestions.resolve(Response.json({ suggestions: [suggestion] })))
    assert.equal(ui.skeletons(), 0)
    await ui.click(ui.applyButton())
    assert.deepEqual(ui.applied, ['Revised controlled draft.'])
    assert.equal(ui.calls.at(-1).body.action, 'apply-suggestion')
    assert.equal(ui.calls.at(-1).body.suggestion, suggestion.text)
})

for (const [name, response] of [
    ['HTTP failure', () => Response.json({ error: 'Controlled failure' }, { status: 504 })],
    [
        'network rejection',
        () => {
            throw new Error('Controlled failure')
        },
    ],
    ['invalid JSON', () => new Response('invalid')],
    ['empty result', () => Response.json({ suggestions: [] })],
]) {
    test(`suggestions ${name}: retains valid analysis and settles loading`, async (t) => {
        const ui = await mount(t, { '/api/analyze': [success], '/api/suggestions': [response] })
        await ui.click()
        assert.equal(ui.button().disabled, false)
        assert.equal(ui.skeletons(), 0)
        assert.match(ui.text(), /75/)
        assert.match(ui.text(), /No suggestions available/)
        assert.deepEqual(ui.errors, [])
    })
}

for (const newerFails of [false, true]) {
    test(`stale suggestions cannot overwrite or clear newer ${newerFails ? 'failed' : 'pending'} attempt`, async (t) => {
        const old = deferred(),
            current = deferred()
        const ui = await mount(t, {
            '/api/analyze': [
                success,
                newerFails ? () => Response.json({ error: 'Retry failed' }, { status: 504 }) : success,
            ],
            '/api/suggestions': [old.promise, current.promise],
        })
        await ui.click()
        await ui.click()
        await React.act(async () =>
            old.resolve(Response.json({ suggestions: [{ text: 'Stale suggestion', type: 'content' }] })),
        )
        assert.doesNotMatch(ui.text(), /Stale suggestion/)
        assert.match(ui.text(), /75/)
        assert.equal(ui.skeletons(), newerFails ? 0 : 3)
        if (newerFails) {
            assert.deepEqual(ui.errors, ['Retry failed'])
            assert.equal(ui.suggestionCalls(), 1)
        } else {
            await React.act(async () => current.resolve(Response.json({ suggestions: [suggestion] })))
            assert.match(ui.text(), /Ask the reader/)
            assert.equal(ui.skeletons(), 0)
        }
    })
}

for (const [name, response] of [
    ['HTTP error', () => new Response('', { status: 504 })],
    [
        'network rejection',
        () => {
            throw new Error('Controlled failure')
        },
    ],
]) {
    test(`apply ${name}: error visible, Apply enabled for retry`, async (t) => {
        const ui = await mount(t, {
            '/api/analyze': [success],
            '/api/suggestions': [Response.json({ suggestions: [suggestion] })],
            '/api/generate': [response, Response.json({ result: 'Applied on retry.' })],
        })
        await ui.click()
        await ui.click(ui.applyButton())
        assert.deepEqual(ui.errors, ['Failed to apply suggestion'])
        assert.equal(ui.applyButton().disabled, false)
        await ui.click(ui.applyButton())
        assert.deepEqual(ui.applied, ['Applied on retry.'])
    })
}
