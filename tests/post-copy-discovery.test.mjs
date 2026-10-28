import assert from 'node:assert/strict'
import test from 'node:test'

import { hooks, loadTS, storage } from './helpers/component-harness.mjs'

const discovery = await loadTS('lib/post-copy-discovery.ts')
const feedbackConfig = {
    formId: 'existing-form',
    postCopy: { minCopyCount: 2, minContentLength: 50, delayMs: 1500, dismissCooldownDays: 7 },
    storage: { copyCount: 'fb_copy_count', sessionShown: 'fb_session_shown', dismissedAt: 'fb_dismissed_at' },
}

function localStorageFixture() {
    const map = new Map()
    return {
        get length() {
            return map.size
        },
        key: (i) => [...map.keys()][i] ?? null,
        getItem: (key) => map.get(key) ?? null,
        setItem: (key, value) => map.set(key, value),
    }
}

async function fixture({
    pathname = '/',
    embedded = false,
    local = localStorageFixture(),
    session = storage(),
    captureThrows = false,
} = {}) {
    const h = hooks()
    const timers = new Map()
    const events = []
    let popups = 0
    const window = {
        location: { pathname, href: `https://preview.test${pathname}` },
        Tally: { openPopup: () => popups++ },
    }
    window.self = window
    window.top = embedded ? {} : window
    const { useFeedbackAfterCopy } = await loadTS(
        'hooks/use-feedback-after-copy.ts',
        {
            'react': h.react,
            'posthog-js': {
                capture: (name, props) => {
                    if (captureThrows) throw Error('analytics unavailable')
                    events.push({ name, ...props })
                },
            },
            '@/config/feedback': { feedbackConfig },
            '@/lib/post-copy-discovery': discovery,
        },
        {
            window,
            localStorage: local,
            sessionStorage: session,
            setTimeout: (fn) => {
                const id = Symbol()
                timers.set(id, fn)
                return id
            },
            clearTimeout: (id) => timers.delete(id),
        },
    )
    return {
        h,
        events,
        local,
        session,
        window,
        get popups() {
            return popups
        },
        render: () => h.render(useFeedbackAfterCopy),
        flush: () => {
            for (const [id, fn] of timers) {
                timers.delete(id)
                fn()
            }
        },
        get pending() {
            return timers.size
        },
    }
}

test('only top-level homepage and formatter are discovery sources', () => {
    assert.equal(discovery.discoverySource('/', false), 'homepage')
    assert.equal(discovery.discoverySource('/formatter', false), 'formatter')
    for (const path of ['/embed', '/dashboard/editor', '/generator', '/blog', '/preview']) {
        assert.equal(discovery.discoverySource(path, false), null)
    }
    assert.equal(discovery.discoverySource('/', true), null)
})

for (const path of ['/', '/formatter']) {
    test(`${path}: second successful short copy schedules one question, never Tally`, async () => {
        const f = await fixture({ pathname: path })
        const hook = f.render()
        hook.notifyCopy(5)
        assert.equal(f.pending, 0)
        hook.notifyCopy(5)
        hook.notifyCopy(5)
        assert.equal(f.pending, 1)
        assert.equal(f.events.filter((e) => e.name === 'post_copy_job_eligible').length, 1)
        f.flush()
        const shown = f.render()
        assert.equal(shown.question.source, path === '/' ? 'homepage' : 'formatter')
        assert.ok(f.local.getItem(discovery.JOB_DISCOVERY_KEY))
        assert.equal(f.popups, 0)
        shown.finishQuestion('own_posts')
        shown.finishQuestion('other')
        assert.equal(f.render().question, null)
        assert.equal(f.events.filter((e) => e.name === 'post_copy_job_answered').length, 1)
        hook.notifyCopy(5)
        assert.equal(f.pending, 0)
        assert.equal(f.local.getItem('fb_dismissed_at'), null)
        assert.equal(f.session.getItem('fb_session_shown'), null)
    })
}

test('dismissal closes without response, redirect, Tally or new request', async () => {
    const f = await fixture()
    const hook = f.render()
    hook.notifyCopy(10)
    hook.notifyCopy(10)
    f.flush()
    f.render().finishQuestion()
    assert.equal(f.render().question, null)
    assert.equal(f.events.at(-1).name, 'post_copy_job_dismissed')
    assert.equal(f.events.at(-1).job, undefined)
    assert.equal(f.window.location.pathname, '/')
    assert.equal(f.popups, 0)
})

test('seven-day cooldown is shared across routes and new hook instances', async () => {
    const local = localStorageFixture()
    const f = await fixture({ local })
    const hook = f.render()
    hook.notifyCopy(10)
    hook.notifyCopy(10)
    f.flush()
    const second = await fixture({ pathname: '/formatter', local })
    second.render().notifyCopy(10)
    assert.equal(second.pending, 0)
    const now = Date.now()
    local.setItem(discovery.JOB_DISCOVERY_KEY, String(now - discovery.JOB_DISCOVERY_COOLDOWN_MS))
    assert.equal(discovery.discoveryAvailable(local, storage(), now), true)
    local.setItem(discovery.JOB_DISCOVERY_KEY, String(now - discovery.JOB_DISCOVERY_COOLDOWN_MS + 1))
    assert.equal(discovery.discoveryAvailable(local, storage(), now), false)
})

test('old Tally session and dismissal coalesce, malformed cooldown fails closed', async () => {
    for (const [target, key, value] of [
        ['session', 'fb_session_shown', '1'],
        ['local', 'fb_dismissed_at', String(Date.now())],
        ['local', discovery.JOB_DISCOVERY_KEY, 'corrupt'],
        ['local', discovery.JOB_DISCOVERY_KEY, ''],
        ['local', discovery.JOB_DISCOVERY_KEY, String(Date.now() + 100000)],
    ]) {
        const f = await fixture()
        f[target].setItem(key, value)
        const hook = f.render()
        hook.notifyCopy(60)
        hook.notifyCopy(60)
        f.flush()
        assert.equal(f.render().question, null)
        assert.equal(f.popups, 0)
    }
})

test('blocked reads, blocked writes, session failures and analytics failure never escape copy callback', async () => {
    const broken = {
        getItem() {
            throw Error('blocked')
        },
        setItem() {
            throw Error('blocked')
        },
    }
    for (const options of [
        { local: broken },
        { local: { ...localStorageFixture(), setItem: broken.setItem } },
        { session: broken },
        { captureThrows: true },
    ]) {
        const f = await fixture(options)
        const hook = f.render()
        assert.doesNotThrow(() => {
            hook.notifyCopy(60)
            hook.notifyCopy(60)
            f.flush()
        })
    }
})

test('storage becoming unavailable during delay suppresses question safely', async () => {
    const f = await fixture()
    const hook = f.render()
    hook.notifyCopy(60)
    hook.notifyCopy(60)
    f.local.setItem = () => {
        throw Error('quota')
    }
    assert.doesNotThrow(f.flush)
    assert.equal(f.render().question, null)
})

test('competing mounts recheck the same cooldown before showing', async () => {
    const local = localStorageFixture()
    const a = await fixture({ local })
    const b = await fixture({ local })
    a.render().notifyCopy(60)
    b.render().notifyCopy(60)
    a.render().notifyCopy(60)
    assert.equal(a.pending, 1)
    assert.equal(b.pending, 1)
    a.flush()
    b.flush()
    assert.ok(a.render().question)
    assert.equal(b.render().question, null)
})

test('embed and third-party frames never count or solicit', async () => {
    for (const options of [{ pathname: '/embed' }, { embedded: true }, { pathname: '/formatter', embedded: true }]) {
        const f = await fixture(options)
        const hook = f.render()
        hook.notifyCopy(60)
        hook.notifyCopy(60)
        f.flush()
        assert.equal(f.render().question, null)
        assert.equal(f.popups, 0)
        assert.equal(f.local.getItem('fb_copy_count'), null)
    }
})

test('unmount and navigation invalidate pending solicitation', async () => {
    const f = await fixture()
    const hook = f.render()
    hook.notifyCopy(60)
    hook.notifyCopy(60)
    f.h.unmount()
    assert.equal(f.pending, 0)
    const g = await fixture()
    const other = g.render()
    other.notifyCopy(60)
    other.notifyCopy(60)
    g.window.location.pathname = '/dashboard'
    g.flush()
    assert.equal(g.render().question, null)
    assert.equal(g.local.getItem(discovery.JOB_DISCOVERY_KEY), null)
})

test('legacy dashboard Tally remains available but respects new shared cooldown', async () => {
    const f = await fixture({ pathname: '/dashboard/editor' })
    const hook = f.render()
    hook.notifyCopy(60)
    hook.notifyCopy(60)
    f.flush()
    assert.equal(f.popups, 1)
    const g = await fixture({ pathname: '/dashboard/editor' })
    g.local.setItem(discovery.JOB_DISCOVERY_KEY, String(Date.now()))
    const next = g.render()
    next.notifyCopy(60)
    next.notifyCopy(60)
    g.flush()
    assert.equal(g.popups, 0)
})

test('overlap records only categorical local-marker presence, never global non-enrollment or identifiers', () => {
    const local = localStorageFixture()
    const session = localStorageFixture()
    assert.equal(discovery.discoveryOverlap(local, session), 'unknown')
    local.setItem('lp-monthly-offer:anonymous-id', 'private-id')
    assert.equal(discovery.discoveryOverlap(local, session), 'unknown')
    local.setItem('lp-monthly-offer:private-id', 'private-assignment')
    assert.equal(discovery.discoveryOverlap(local, session), 'local_marker_present')
    const clean = localStorageFixture()
    session.setItem('lp-draft-first:private-id', 'private-assignment')
    assert.equal(discovery.discoveryOverlap(clean, session), 'local_marker_present')
})

test('in-flow question exposes only after viewport entry, once, with bounded options and dismissal', async () => {
    const h = hooks()
    const events = []
    const listeners = new Map()
    const finished = []
    let intersect
    let disconnects = 0
    const jsx = (type, props) => {
        if (props.ref) props.ref.current = { tagName: 'SECTION' }
        return { type, props }
    }
    const { PostCopyJobQuestion } = await loadTS(
        'components/feedback/post-copy-job-question.tsx',
        {
            'react': h.react,
            'react/jsx-runtime': { jsx, jsxs: jsx },
            'lucide-react': { X: 'X' },
            'posthog-js': { capture: (...args) => events.push(args) },
            '@/lib/post-copy-discovery': discovery,
        },
        {
            IntersectionObserver: class {
                constructor(callback) {
                    intersect = callback
                }
                observe(element) {
                    assert.equal(element.tagName, 'SECTION')
                }
                disconnect() {
                    disconnects++
                }
            },
            window: {
                addEventListener: (name, fn) => listeners.set(name, fn),
                removeEventListener: (name) => listeners.delete(name),
            },
        },
    )
    const properties = { source: 'homepage', experiment_overlap: 'unknown' }
    const render = () => PostCopyJobQuestion({ properties, onFinish: (job) => finished.push(job) })
    const tree = h.render(render)
    h.render(render)
    assert.equal(events.length, 0, 'mount below fold is not exposure')
    intersect([{ isIntersecting: false }])
    assert.equal(events.length, 0)
    intersect([{ isIntersecting: true }])
    intersect([{ isIntersecting: true }])
    assert.equal(events.length, 1)
    assert.equal(events[0][0], 'post_copy_job_exposed')
    assert.doesNotMatch(tree.props.className, /\b(fixed|absolute|sticky)\b/, 'question reserves normal page space')
    const options = tree.props.children[1].props.children
    assert.deepEqual(
        Array.from(options, (node) => node.props.children),
        ['My own LinkedIn posts', 'Posts for clients or a company', 'Ad creative', 'Something else'],
    )
    options[2].props.onClick()
    assert.equal(finished.at(-1), 'ad_creative')
    tree.props.children[0].props.children[1].props.onClick()
    assert.equal(finished.at(-1), undefined)
    listeners.get('keydown')({ key: 'Escape' })
    assert.equal(finished.at(-1), undefined)
    h.unmount()
    assert.equal(listeners.size, 0)
    assert.ok(disconnects >= 2)
})
