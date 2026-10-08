import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { parseHTML } from 'linkedom'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

function load(path, mocks = {}) {
    const url = new URL(`../${path}`, import.meta.url)
    const compiled = ts.transpileModule(readFileSync(url, 'utf8'), {
        compilerOptions: {
            esModuleInterop: true,
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
        },
        fileName: fileURLToPath(url),
    }).outputText
    const loadedModule = { exports: {} }
    runInNewContext(compiled, {
        exports: loadedModule.exports,
        module: loadedModule,
        URLSearchParams,
        require(name) {
            if (name === 'react') return mocks.react ?? React
            if (name === 'react/jsx-runtime') return jsxRuntime
            assert.ok(name in mocks, `Missing article CTA mock: ${name}`)
            return mocks[name]
        },
    })
    return loadedModule.exports
}

const config = load('config/article-tool-entries.ts')
const urls = load('utils/urls.ts', {
    '@/types/urls': { UtmMediums: { Blog: 'blog' } },
    '@/config/site': { site: { url: 'https://linkedinpreview.com' } },
    '@/config/urls': { UtmSource: 'linkedinpreview.com' },
})
let pathname = '/'
let mounts = 0
const events = []
function SyntheticTool({ layout }) {
    assert.equal(layout, 'tabs')
    React.useEffect(() => {
        mounts++
    }, [])
    return React.createElement('textarea', { 'data-synthetic-tool': true, 'defaultValue': 'Synthetic stored draft' })
}
const { TrackClick } = load('components/tracking/track-click.tsx', {
    'posthog-js': { capture: (event, properties) => events.push({ event, properties }) },
})
const passthrough = ({ children, ...props }) => React.createElement('div', props, children)
const { CtaCard } = load('components/cta-card.tsx', {
    'next/dynamic': (_loader, options) => {
        assert.equal(options.ssr, false)
        return SyntheticTool
    },
    'next/link': ({ children, prefetch: _prefetch, ...props }) => React.createElement('a', props, children),
    'next/navigation': { usePathname: () => pathname },
    '@/utils/urls': urls,
    '@/types/urls': { UtmMediums: { Blog: 'blog' } },
    '@/config/article-tool-entries': config,
    '@/lib/utils': { cn: (...classes) => classes.filter(Boolean).join(' '), shineAnimation: '' },
    '@/components/ui/button': { Button: ({ children }) => children },
    '@/components/ui/card': { Card: passthrough, CardDescription: passthrough, CardTitle: passthrough },
    '@/components/tracking/track-click': { TrackClick },
})
const propsFor = (entry) => ({
    title: entry.cardTitle,
    description: 'Original description and conversion elements stay intact',
    primaryButtonText: 'Original CTA',
    primaryButtonUrl: '/#tool',
    secondaryButtonText: 'Secondary CTA',
    secondaryButtonUrl: '/formatter',
})

function installDOM() {
    const { window } = parseHTML('<html><body><div id="root"></div></body></html>')
    globalThis.window = window
    globalThis.document = window.document
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    return window
}
async function click(window, element, overrides = {}) {
    const event = new window.Event('click', { bubbles: true, cancelable: true })
    Object.assign(event, { button: 0, detail: 1, ...overrides })
    await React.act(async () => element.dispatchEvent(event))
    return event
}

test('exact pathname/title allowlist excludes other routes and later cards', () => {
    assert.equal(config.ARTICLE_TOOL_ENTRIES.length, 4)
    for (const entry of config.ARTICLE_TOOL_ENTRIES) {
        assert.equal(config.articleToolEntry(entry.pathname, entry.cardTitle), entry)
        for (const other of [null, '/', '/formatter', `${entry.pathname}/`, `${entry.pathname}-other`]) {
            assert.equal(config.articleToolEntry(other, entry.cardTitle), undefined)
        }
        assert.equal(config.articleToolEntry(entry.pathname, 'Later card'), undefined)
        const slug = entry.pathname.split('/').at(-1)
        const mdx = readFileSync(new URL(`../contents/blog/${slug}.mdx`, import.meta.url), 'utf8')
        const cards = [...mdx.matchAll(/<CtaCard\s+[\s\S]*?\/>/g)].map((match) => match[0])
        assert.equal(cards.filter((card) => card.includes(`title='${entry.cardTitle}'`)).length, 1)
        assert.ok(cards[0].includes(`title='${entry.cardTitle}'`))
        assert.ok(cards[0].includes("primaryButtonUrl='/#tool'"))
    }
})

for (const entry of config.ARTICLE_TOOL_ENTRIES) {
    test(`${entry.pathname}: server fallback, keyboard open, single persistent tool and existing event`, async () => {
        pathname = entry.pathname
        mounts = 0
        events.length = 0
        const props = propsFor(entry)
        const markup = renderToStaticMarkup(React.createElement(CtaCard, props))
        assert.ok(markup.includes(entry.buttonText))
        assert.ok(markup.includes(entry.supportingCopy))
        assert.ok(markup.includes(props.description))
        assert.match(
            markup,
            /href="\/\?utm_source=linkedinpreview.com&amp;utm_medium=blog&amp;utm_content=card_cta#tool"/,
        )
        assert.ok(!markup.includes('data-synthetic-tool'))
        const window = installDOM()
        const root = createRoot(document.getElementById('root'))
        await React.act(async () => root.render(React.createElement(CtaCard, props)))
        const link = document.querySelector('a[aria-expanded]')
        assert.equal(link.getAttribute('aria-expanded'), 'false')
        for (const modifier of [
            { ctrlKey: true },
            { metaKey: true },
            { altKey: true },
            { shiftKey: true },
            { button: 1 },
        ]) {
            const event = await click(window, link, modifier)
            assert.equal(event.defaultPrevented, false)
            assert.equal(mounts, 0)
        }
        events.length = 0
        const event = await click(window, link, { detail: 0 })
        assert.equal(event.defaultPrevented, true)
        assert.equal(link.getAttribute('aria-expanded'), 'true')
        assert.equal(document.querySelectorAll('[data-synthetic-tool]').length, 1)
        assert.equal(mounts, 1)
        assert.equal(events.length, 1)
        assert.equal(events[0].event, 'cta_card_clicked')
        assert.equal(events[0].properties.button_text, entry.buttonText)
        assert.equal(events[0].properties.button_url, '/#tool')
        assert.equal(events[0].properties.card_title, entry.cardTitle)
        assert.equal(events[0].properties.button_type, 'primary')
        const tool = document.querySelector('[data-synthetic-tool]')
        tool.value = 'Synthetic edited draft'
        await click(window, link)
        await React.act(async () => root.render(React.createElement(CtaCard, { ...props, pattern: 'dots' })))
        assert.equal(document.querySelector('[data-synthetic-tool]'), tool)
        assert.equal(tool.value, 'Synthetic edited draft')
        assert.equal(mounts, 1)
        const secondary = [...document.querySelectorAll('a')].find((anchor) => anchor.textContent === 'Secondary CTA')
        assert.equal((await click(window, secondary)).defaultPrevented, false)
        assert.equal(events.at(-1).properties.button_type, 'secondary')
        await React.act(async () => root.unmount())
    })
}

test('nonmatching cards retain primary label, fallback and navigation without loading Tool', async () => {
    pathname = '/blog/where-are-linkedin-drafts-saved'
    const window = installDOM()
    const root = createRoot(document.getElementById('root'))
    mounts = 0
    const props = { ...propsFor(config.ARTICLE_TOOL_ENTRIES[0]), title: 'Format Your Posts Before Publishing' }
    await React.act(async () => root.render(React.createElement(CtaCard, props)))
    const primary = [...document.querySelectorAll('a')].find((anchor) => anchor.textContent === 'Original CTA')
    assert.ok(primary)
    assert.equal(primary.hasAttribute('aria-expanded'), false)
    assert.equal((await click(window, primary)).defaultPrevented, false)
    assert.equal(mounts, 0)
    assert.equal(document.querySelectorAll('[data-article-tool]').length, 0)
    await React.act(async () => root.unmount())
})

test('actual Tool keeps default/embed desktop layout and reuses persistent tabs only when requested', () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Synthetic draft' }] }] }
    for (const props of [
        {},
        { variant: 'embed' },
        { desktop: false },
        { variant: 'embed', desktop: false },
        { layout: 'tabs' },
        { layout: 'tabs', tab: 'preview' },
    ]) {
        let index = 0
        const states = [doc, null, props.tab ?? 'editor', doc, null, false]
        const hooks = {
            ...React,
            useState: () => [states[index++], () => {}],
            useRef: (current) => ({ current }),
            useCallback: (fn) => fn,
            useEffect: () => {},
        }
        const { Tool } = load('components/tool/tool.tsx', {
            'react': hooks,
            'next/dynamic': () => () => React.createElement('div', { 'data-editor-seam': true }),
            'next/link': passthrough,
            'lucide-react': { ArrowUpRight: () => null, Eye: () => null, PenLine: () => null },
            'posthog-js': { capture() {} },
            'react-resizable-panels': {
                Group: ({ children }) => React.createElement('div', { 'data-group': true }, children),
                Panel: passthrough,
            },
            'sonner': { toast() {} },
            '@/config/entry-sources': { withEntrySource: (path) => path },
            '@/config/routes': { Routes: { DashboardEditor: () => '/dashboard/editor' } },
            // This layout-only render also runs in the detached accepted-draft preflight.
            // Handoff callbacks must not run here; actual import tests cover them separately.
            '@/lib/draft-first': {
                ACTIVATION_PARAM: 'activation',
                draftFirstProperties: () => assert.fail('Layout render invoked draft handoff'),
                prepareDraftFirst: () => assert.fail('Layout render invoked draft handoff'),
            },
            '@/lib/draft-media': { pruneDraftMedia() {}, putDraftMedia() {} },
            '@/lib/draft-url': { decodeDraft() {}, encodeDraft() {} },
            '@/lib/editor-utils': { extractPlainText: () => 'Synthetic draft' },
            '@/lib/utils': { cn: (...classes) => classes.filter(Boolean).join(' ') },
            '@/hooks/use-draft-persistence': { useDraftPersistence: () => ({ flush() {} }) },
            '@/hooks/use-is-desktop': { useIsDesktop: () => props.desktop !== false },
            '@/components/ui/button': { Button: passthrough },
            './editor-loading': { EditorLoading: () => null },
            './preview/preview-panel': {
                PreviewPanel: () => React.createElement('div', { 'data-preview-seam': true }),
            },
            './resize-handle': { ResizeHandle: () => null },
        })
        const html = renderToStaticMarkup(React.createElement(Tool, props))
        if (props.layout === 'tabs' || props.desktop === false) {
            assert.ok(!html.includes('data-group'))
            assert.ok(html.includes('Editor') && html.includes('Preview'))
            assert.equal((html.match(/data-editor-seam/g) ?? []).length, 1)
            assert.equal((html.match(/data-preview-seam/g) ?? []).length, 1)
            assert.ok(html.includes('invisible absolute inset-0'))
            if (props.layout === 'tabs') {
                const { document } = parseHTML(html)
                const inactive = document.querySelector('[aria-hidden="true"]')
                assert.ok(inactive.hasAttribute('inert'))
                assert.ok(inactive.className.includes('opacity-0'))
                assert.ok(inactive.className.includes('pointer-events-none'))
                assert.ok(inactive.className.includes('[&_button]:transition-none'))
                assert.ok(!inactive.className.includes('hidden absolute'))
                assert.ok(
                    inactive.querySelector(props.tab === 'preview' ? '[data-editor-seam]' : '[data-preview-seam]'),
                )
            }
        } else {
            assert.ok(html.includes('data-group'))
        }
        if (props.layout !== 'tabs') {
            assert.ok(!html.includes('transition-none'))
            assert.ok(!html.includes('aria-hidden="true"'))
            assert.ok(!html.includes('inert=""'))
        }
        assert.equal(html.includes('Create my LinkedIn plan'), props.variant !== 'embed')
    }
})
