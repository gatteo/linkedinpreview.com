import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

import { OB_EXPERIMENTS } from '../config/onboarding-experiments.ts'

async function mount(getFeatureFlag) {
    const source = await readFile(new URL('../hooks/use-ob-experiment.ts', import.meta.url), 'utf8')
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText
    const loaded = { exports: {} }
    let initialized = false
    let state
    let reads = 0
    const mocks = {
        'react': {
            useState(initialize) {
                if (!initialized) {
                    state = initialize()
                    initialized = true
                }
                return [state]
            },
        },
        'posthog-js': {
            getFeatureFlag:
                getFeatureFlag &&
                ((key) => {
                    reads += 1
                    return getFeatureFlag(key)
                }),
        },
        '@/config/onboarding-experiments': { OB_EXPERIMENTS },
    }
    runInNewContext(compiled, {
        module: loaded,
        exports: loaded.exports,
        require(name) {
            assert.ok(name in mocks, `Unexpected import: ${name}`)
            return mocks[name]
        },
    })
    return {
        render: (key = 'onb-modal-exit', variant) => loaded.exports.useObExperiment(key, variant),
        reads: () => reads,
    }
}

for (const value of ['control', undefined, null, true, false, 'unknown', 'toString', '__proto__']) {
    test(`flag ${String(value)} safely returns current control`, async () => {
        const hook = await mount(() => value)
        assert.equal(hook.render(), OB_EXPERIMENTS['onb-modal-exit'].control)
    })
}

test('known treatment is resolved once without changing after delayed flag updates', async () => {
    let value = 'locked'
    const hook = await mount(() => value)
    assert.equal(hook.render(), OB_EXPERIMENTS['onb-modal-exit'].locked)
    value = 'control'
    assert.equal(hook.render(), OB_EXPERIMENTS['onb-modal-exit'].locked)
    assert.equal(hook.reads(), 1)
})

test('loading assignment stays control when treatment arrives later', async () => {
    let value
    const hook = await mount(() => value)
    assert.equal(hook.render(), OB_EXPERIMENTS['onb-modal-exit'].control)
    value = 'locked'
    assert.equal(hook.render(), OB_EXPERIMENTS['onb-modal-exit'].control)
    assert.equal(hook.reads(), 1)
})

test('uninitialized PostHog keeps control', async () => {
    const hook = await mount(undefined)
    assert.equal(hook.render(), OB_EXPERIMENTS['onb-modal-exit'].control)
})

test('failed flag read keeps control instead of breaking the product', async () => {
    const hook = await mount(() => {
        throw new Error('Synthetic flag read failure')
    })
    assert.equal(hook.render(), OB_EXPERIMENTS['onb-modal-exit'].control)
})

test('persisted header treatment uses the existing registry without a second flag read', async () => {
    const hook = await mount(() => {
        throw new Error('Must not read after assignment')
    })
    assert.equal(hook.render('onb-header-pro-entry', 'pro').label, 'Explore Pro & create my plan')
    assert.equal(hook.reads(), 0)
})
