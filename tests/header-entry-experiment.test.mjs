import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const id = '00000000-0000-4000-8000-000000000011'
const eligibilityAt = '2026-10-07T09:30:00.000Z'

async function load() {
    const source = await readFile(new URL('../lib/header-entry-experiment.ts', import.meta.url), 'utf8')
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText
    const loaded = { exports: {} }
    runInNewContext(compiled, { module: loaded, exports: loaded.exports })
    return loaded.exports
}

function dependencies(variant, storage = new Map()) {
    const events = []
    const order = []
    return {
        events,
        order,
        storage,
        input: {
            storage: {
                getItem: (key) => storage.get(key) ?? null,
                setItem: (key, value) => storage.set(key, value),
            },
            readVariant() {
                order.push('flag')
                return variant
            },
            capture(event, props) {
                order.push(event)
                events.push({ event, props })
            },
            createId: () => id,
            now: () => eligibilityAt,
            releaseSha: 'synthetic-preview-sha',
        },
    }
}

for (const variant of ['control', 'pro', undefined, false, true, 'unknown', 'toString', '__proto__']) {
    test(`header ${String(variant)}: eligibility precedes flag read and failures remain control`, async () => {
        const lib = await load()
        const deps = dependencies(variant)
        const state = lib.enrollHeaderEntry(deps.input)
        assert.equal(state.renderedVariant, variant === 'pro' ? 'pro' : 'control')
        assert.equal(state.enrollment.variant, variant === 'pro' ? 'pro' : 'control')
        assert.deepEqual(deps.order, ['daily_test_eligible', 'flag', 'daily_test_assigned'])
        assert.equal(deps.events[0].props.enrollment_id, id)
        assert.equal(deps.events[0].props.variant, 'pending')
        assert.equal(deps.events[0].props.entry_source, 'navbar')
    })
}

test('assignment and enrollment ID survive refresh, remount and anonymous-to-known navigation', async () => {
    const storage = new Map()
    const first = await load()
    const initial = first.enrollHeaderEntry(dependencies('pro', storage).input)
    const refreshed = await load()
    const deps = dependencies('control', storage)
    deps.input.createId = () => assert.fail('A persisted assignment must not be replaced on auth/remount')
    const resumed = refreshed.enrollHeaderEntry(deps.input)
    assert.equal(resumed.enrollment.enrollmentId, initial.enrollment.enrollmentId)
    assert.equal(resumed.enrollment.eligibilityAt, eligibilityAt)
    assert.equal(resumed.enrollment.variant, 'pro')
    assert.equal(resumed.renderedVariant, 'pro')
    assert.equal(deps.events[0].props.resumed, true)
})

test('disabled or unloaded remote flag renders control even with a persisted treatment', async () => {
    const storage = new Map()
    const lib = await load()
    lib.enrollHeaderEntry(dependencies('pro', storage).input)
    const next = await load()
    const state = next.enrollHeaderEntry(dependencies(undefined, storage).input)
    assert.equal(state.enrollment.variant, 'pro', 'preserve original intention-to-treat assignment')
    assert.equal(state.renderedVariant, 'control', 'flag kill overrides sticky treatment')
})

test('loading fallback never changes assignment on remount when a treatment loads later', async () => {
    const storage = new Map()
    const lib = await load()
    lib.enrollHeaderEntry(dependencies(undefined, storage).input)
    const next = await load()
    const state = next.enrollHeaderEntry(dependencies('pro', storage).input)
    assert.equal(state.enrollment.variant, 'control')
    assert.equal(state.renderedVariant, 'control')
    assert.equal(state.enrollment.assignmentStatus, 'flag_unavailable')
})

for (const method of ['getItem', 'setItem']) {
    test(`unavailable storage ${method} retains eligible denominator and safe control`, async () => {
        const lib = await load()
        const deps = dependencies('pro')
        deps.input.storage[method] = () => {
            throw new Error('Synthetic unavailable storage')
        }
        const state = lib.enrollHeaderEntry(deps.input)
        assert.equal(state.enrollment.variant, 'control')
        assert.equal(state.enrollment.assignmentStatus, 'storage_unavailable')
        assert.equal(deps.events[0].event, 'daily_test_eligible')
        assert.equal(state.renderedVariant, 'control')
    })
}

test('flag getter failure and malformed persisted state cannot expose treatment', async () => {
    const lib = await load()
    const deps = dependencies('pro', new Map([[lib.DAILY_ENROLLMENT_KEY, 'bad json']]))
    deps.input.readVariant = () => {
        throw new Error('Synthetic getter failure')
    }
    const state = lib.enrollHeaderEntry(deps.input)
    assert.equal(state.renderedVariant, 'control')
    assert.equal(deps.events[0].event, 'daily_test_eligible')
})

test('a preceding daily-lane enrollment excludes this test before flags or eligibility', async () => {
    const lib = await load()
    const deps = dependencies('pro', new Map([[lib.DAILY_ENROLLMENT_KEY, JSON.stringify({ testId: 'EXP-12' })]]))
    assert.equal(lib.enrollHeaderEntry(deps.input), null)
    assert.equal(deps.order.length, 0)
})

test('analytics exception cannot break the CTA or expose treatment', async () => {
    const lib = await load()
    const deps = dependencies('pro')
    deps.input.capture = () => {
        throw new Error('Synthetic analytics failure')
    }
    const state = lib.enrollHeaderEntry(deps.input)
    assert.equal(state.renderedVariant, 'control')
    assert.equal(state.enrollment.assignmentStatus, 'analytics_unavailable')
})

test('event properties contain no draft, profile, email, payment or auth data', async () => {
    const lib = await load()
    const state = lib.enrollHeaderEntry(dependencies('pro').input)
    const props = lib.headerEntryProperties(state.enrollment)
    assert.deepEqual(Object.keys(props).sort(), [
        'assignment_status',
        'assignment_version',
        'billing_state_at_assignment',
        'downstream_release_cohort',
        'eligibility_at',
        'enrollment_id',
        'entry_source',
        'release_sha',
        'rendered_variant',
        'test_id',
        'variant',
    ])
})

test('only the desktop homepage header CTA changes; mobile and free tool are not experiment slots', async () => {
    const cta = await readFile(new URL('../components/header/header-plan-cta.tsx', import.meta.url), 'utf8')
    assert.match(cta, /pathname !== '\/'/)
    assert.match(cta, /min-width: 768px/)
    assert.match(cta, /withEntrySource\(Routes\.Dashboard, 'navbar'\)/)
    assert.match(cta, /posthog\?\.capture\('cta_button_clicked', \{ button_name: 'create_plan', source: 'navbar' \}\)/)
    assert.match(cta, /daily_test_action/)
    assert.doesNotMatch(cta, /encodeDraft|fetch\(|createClient|stripe|editor-panel|onboarding-modal/)
    const mobile = await readFile(new URL('../components/header/mobile-nav.tsx', import.meta.url), 'utf8')
    assert.match(mobile, /Create my LinkedIn plan/)
    assert.doesNotMatch(mobile, /HeaderPlanCta|onb-header-pro-entry|Explore Pro/)
})
