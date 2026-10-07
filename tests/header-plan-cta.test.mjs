import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import * as React from 'react'
import * as jsx from 'react/jsx-runtime'
import { parseHTML } from 'linkedom'
import { createRoot } from 'react-dom/client'
import ts from 'typescript'

import { withEntrySource } from '../config/entry-sources.ts'
import { OB_EXPERIMENTS } from '../config/onboarding-experiments.ts'
import { Routes } from '../config/routes.ts'

async function compile(path, mocks) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8')
    const code = ts.transpileModule(source, {
        compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
        },
    }).outputText
    const loaded = { exports: {} }
    runInNewContext(code, {
        module: loaded,
        exports: loaded.exports,
        window: globalThis.window,
        localStorage: globalThis.localStorage,
        crypto: globalThis.crypto,
        process: { env: {} },
        require(name) {
            assert.ok(name in mocks, `Missing mock: ${name}`)
            return mocks[name]
        },
    })
    return loaded.exports
}

for (const scenario of [
    { path: '/', desktop: true, flag: 'pro', label: 'Explore Pro & create my plan', enrolled: true },
    { path: '/', desktop: true, flag: undefined, label: 'Create my LinkedIn plan', enrolled: true },
    { path: '/', desktop: false, flag: 'pro', label: 'Create my LinkedIn plan', enrolled: false },
    { path: '/blog', desktop: true, flag: 'pro', label: 'Create my LinkedIn plan', enrolled: false },
]) {
    test(`actual React header callbacks: ${scenario.path}/${scenario.desktop}/${String(scenario.flag)}`, async () => {
        const { window } = parseHTML('<html><body><div id="root"></div></body></html>')
        const storage = new Map()
        globalThis.window = window
        globalThis.document = window.document
        globalThis.localStorage = {
            getItem: (key) => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, value),
        }
        globalThis.IS_REACT_ACT_ENVIRONMENT = true
        window.matchMedia = () => ({ matches: scenario.desktop, addEventListener() {}, removeEventListener() {} })
        const events = []
        const order = []
        let flag = scenario.flag
        let flagListener
        const sdk = {
            capture(event, props) {
                order.push(event)
                events.push({ event, props })
            },
            getFeatureFlag() {
                order.push('flag_read')
                return flag
            },
            register() {},
            onFeatureFlags(listener) {
                flagListener = listener
                return () => {}
            },
        }
        const lib = await compile('lib/header-entry-experiment.ts', {})
        const hook = await compile('hooks/use-ob-experiment.ts', {
            'react': React,
            'posthog-js': sdk,
            '@/config/onboarding-experiments': { OB_EXPERIMENTS },
        })
        const component = await compile('components/header/header-plan-cta.tsx', {
            'react': React,
            'react/jsx-runtime': jsx,
            'next/link': ({ children, ...props }) => React.createElement('a', props, children),
            'next/navigation': { usePathname: () => scenario.path },
            'posthog-js': sdk,
            '@/config/entry-sources': { withEntrySource },
            '@/config/onboarding-experiments': { OB_EXPERIMENTS },
            '@/config/routes': { Routes },
            '@/lib/header-entry-experiment': lib,
            '@/hooks/use-ob-experiment': hook,
            '@/components/ui/button': { Button: ({ children }) => children },
        })
        const root = createRoot(window.document.getElementById('root'))
        try {
            await React.act(async () => root.render(React.createElement(component.HeaderPlanCta)))
            const anchor = window.document.querySelector('a')
            assert.equal(anchor.textContent, scenario.label)
            assert.equal(anchor.getAttribute('href'), '/dashboard?from=navbar')
            if (scenario.enrolled) {
                assert.deepEqual(order.slice(0, 4), [
                    'daily_test_eligible',
                    'flag_read',
                    'daily_test_assigned',
                    'daily_test_exposed',
                ])
            } else assert.equal(order.length, 0)
            await React.act(async () => anchor.dispatchEvent(new window.Event('click', { bubbles: true })))
            assert.ok(events.some((row) => row.event === 'cta_button_clicked' && row.props.source === 'navbar'))
            assert.equal(
                events.some((row) => row.event === 'daily_test_action'),
                scenario.enrolled,
            )
            if (scenario.enrolled) {
                const eligibility = events.find((row) => row.event === 'daily_test_eligible')
                const action = events.find((row) => row.event === 'daily_test_action')
                assert.equal(action.props.enrollment_id, eligibility.props.enrollment_id)
                assert.equal(action.props.entry_source, 'navbar')
                await React.act(async () => {
                    flag = undefined
                    flagListener()
                })
                assert.equal(window.document.querySelector('a').textContent, 'Create my LinkedIn plan')
            }
        } finally {
            await React.act(async () => root.unmount())
            delete globalThis.IS_REACT_ACT_ENVIRONMENT
        }
    })
}
