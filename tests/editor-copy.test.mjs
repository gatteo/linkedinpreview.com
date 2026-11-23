import assert from 'node:assert/strict'
import test from 'node:test'
import runes from 'runes'

import { hooks, loadTS, tick } from './helpers/component-harness.mjs'

const utils = await loadTS('components/tool/utils.ts', { runes })
const doc = (text) => ({
    type: 'doc',
    content: [{ type: 'paragraph', ...(text ? { content: [{ type: 'text', text }] } : {}) }],
})

// Unit evidence: real EditorPanel callbacks/serializer, mocked editor/hooks/clipboard/providers.
async function panel(initialDoc = doc(''), absent = false) {
    const h = hooks()
    const calls = []
    let clipboard = 'Original clipboard 🚀'
    let currentDoc = initialDoc
    const editor = {
        getJSON: () => currentDoc,
        getText: () => utils.toPlainText(utils.processNodes(currentDoc).content),
        view: { dom: new EventTarget() },
        commands: {
            clearContent: () => {
                currentDoc = doc('')
            },
        },
    }
    const stub = () => null
    const Button = stub
    const { EditorPanel } = await loadTS(
        'components/tool/editor-panel.tsx',
        {
            'react': h.react,
            'react/jsx-runtime': h.jsx,
            'next/dynamic': () => stub,
            '@tiptap/extension-underline': {},
            '@tiptap/pm/state': { AllSelection: class {}, Selection: {} },
            '@tiptap/react': { useEditor: () => (absent ? null : editor), EditorContent: stub },
            '@tiptap/starter-kit': { configure: () => ({}) },
            'lucide-react': { Share2: stub, Trash2: stub },
            'posthog-js': {
                capture: (...args) => calls.push(['capture', ...args]),
                captureException: () => calls.push(['error']),
            },
            'sonner': {
                toast: { success: (...args) => calls.push(['toast', ...args]), error: () => calls.push(['error']) },
            },
            '@/config/routes': { ApiRoutes: { Analyze: '/api/analyze' } },
            '@/lib/content-scoring': { countWords: () => 0 },
            '@/lib/linkedin/char-count': { countPostCharacters: (text) => text.length, LINKEDIN_CHAR_LIMIT: 3000 },
            '@/lib/parse-formatted-text': {},
            '@/lib/post-analytics': { getPostAnalytics: (_json, text) => ({ content_length: text.length }) },
            '@/lib/utils': { cn: () => '' },
            '@/hooks/use-anonymous-auth': {
                useAnonymousAuth: () => ({ ensureSession: async () => calls.push(['session']) }),
            },
            '@/hooks/use-feedback-after-copy': {
                useFeedbackAfterCopy: () => ({ notifyCopy: (length) => calls.push(['feedback', length]) }),
            },
            '@/components/tool/extensions/font-style': { FontStyle: {} },
            '../icon': { Icons: { magic: stub, image: stub, copy: stub } },
            '../ui/alert-dialog': Object.fromEntries(
                [
                    'AlertDialog',
                    'AlertDialogAction',
                    'AlertDialogCancel',
                    'AlertDialogContent',
                    'AlertDialogDescription',
                    'AlertDialogFooter',
                    'AlertDialogHeader',
                    'AlertDialogTitle',
                    'AlertDialogTrigger',
                ].map((key) => [key, stub]),
            ),
            '../ui/button': { Button },
            '../ui/tooltip': { Tooltip: stub, TooltipContent: stub, TooltipTrigger: stub },
            './editor-loading': { EditorLoading: stub },
            './share-dialog': { ShareDialog: stub },
            './toolbar': { Toolbar: stub },
            './utils': utils,
        },
        {
            navigator: {
                clipboard: {
                    writeText: async (text) => {
                        calls.push(['write', text])
                        clipboard = text
                    },
                },
            },
            fetch: async (url) => {
                calls.push(['fetch', url])
                return { ok: false }
            },
        },
    )
    const render = () =>
        h.render(() => EditorPanel({ onChange() {}, onMediaChange() {}, onCopyText: () => calls.push(['callback']) }))
    function find(node, predicate) {
        if (!node || typeof node !== 'object') return null
        if (predicate(node)) return node
        for (const child of [node.props?.children].flat(Infinity)) {
            const match = find(child, predicate)
            if (match) return match
        }
        return null
    }
    const copyButton = () =>
        find(render(), (node) => node.type === Button && [node.props.children].flat().includes('Copy Text'))
    // Record the component's actual handleCopy even when no editor is mounted.
    const original = h.react.useCallback
    let handleCopy
    h.react.useCallback = (fn, deps) => {
        const callback = original(fn, deps)
        if (fn.name === '' && deps?.length === 2 && typeof deps[0] === 'function' && typeof deps[1] === 'function')
            handleCopy = callback
        return callback
    }
    render()
    return {
        calls,
        copyButton,
        editor,
        clipboard: () => clipboard,
        setDoc: (next) => {
            currentDoc = next
        },
        clear: () => find(render(), (node) => node.props?.variant === 'destructive').props.onClick(),
        invoke: async () => {
            ;(copyButton()?.props.onClick ?? handleCopy)()
            await tick()
        },
        unmount: () => h.unmount(),
    }
}

for (const absent of [false, true]) {
    test(`${absent ? 'absent editor' : 'empty export'}: actual handler preserves clipboard and skips every success side effect`, async (t) => {
        const ui = await panel(doc(''), absent)
        t.after(ui.unmount)
        await ui.invoke()
        assert.equal(ui.clipboard(), 'Original clipboard 🚀')
        assert.deepEqual(ui.calls, [])
        if (!absent) assert.equal(ui.copyButton().props.disabled, true)
    })
}

test('Clear all rerender disables Copy Text; stale/programmatic handler still guards empty export', async (t) => {
    const ui = await panel(doc('Useful text'))
    t.after(ui.unmount)
    const staleHandler = ui.copyButton().props.onClick
    assert.equal(!!ui.copyButton().props.disabled, false)
    ui.clear()
    ui.calls.length = 0
    assert.equal(ui.copyButton().props.disabled, true)
    staleHandler()
    await tick()
    assert.equal(ui.clipboard(), 'Original clipboard 🚀')
    assert.deepEqual(ui.calls, [])
    ui.setDoc(doc('Restored'))
    assert.equal(!!ui.copyButton().props.disabled, false)
})

for (const text of ['   ', '\n']) {
    test(`existing serializer exports ${JSON.stringify(text)} as empty: preserve clipboard`, async (t) => {
        const ui = await panel(doc(text))
        t.after(ui.unmount)
        await ui.invoke()
        assert.equal(ui.copyButton().props.disabled, true)
        assert.equal(ui.clipboard(), 'Original clipboard 🚀')
        assert.deepEqual(ui.calls, [])
    })
}

for (const text of ['A   B', 'A\nB', 'résumé 👩🏽‍💻']) {
    test(`nonempty export ${JSON.stringify(text)} keeps exact payload and full-copy callbacks`, async (t) => {
        const ui = await panel(doc(text))
        t.after(ui.unmount)
        assert.equal(!!ui.copyButton().props.disabled, false)
        await ui.invoke()
        assert.equal(ui.clipboard(), text)
        assert.deepEqual(
            ui.calls.map(([name]) => name),
            ['write', 'toast', 'callback', 'feedback', 'capture', 'session', 'fetch'],
        )
        assert.equal(ui.calls.find(([name]) => name === 'capture')[1], 'post_copied')
    })
}

test('styled Unicode button uses the actual serializer without changing callback order', async (t) => {
    const styled = doc('Bold 12 café 🚀')
    styled.content[0].content[0].marks = [{ type: 'bold' }]
    const ui = await panel(styled)
    t.after(ui.unmount)
    await ui.invoke()
    assert.equal(ui.clipboard(), '𝗕𝗼𝗹𝗱 𝟭𝟮 𝗰𝗮𝗳é 🚀')
    assert.equal(ui.calls.filter(([name]) => name === 'capture').length, 1)
})
