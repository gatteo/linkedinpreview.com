;(() => {
    const stringify = JSON.stringify.bind(JSON)
    const getItem = Storage.prototype.getItem
    const originalFetch = window.fetch.bind(window)
    window.__dailyEvents = []
    window.__dailyFlagReads = []
    window.__contained = true
    window.__fixtureErrors ??= []
    window.addEventListener('error', (event) => window.__fixtureErrors.push(event.message))
    window.addEventListener('unhandledrejection', (event) => window.__fixtureErrors.push(String(event.reason)))
    const flag = 'onb-header-pro-entry'
    const flags = () => (window.__flagValue === undefined ? {} : { [flag]: window.__flagValue })
    Storage.prototype.getItem = function (key) {
        if (key.startsWith('ph_') && key.endsWith('_posthog')) {
            return stringify({
                distinct_id: 'synthetic-exp11-browser',
                $device_id: 'synthetic-exp11-browser',
                $enabled_feature_flags: flags(),
                $feature_flag_details: {},
            })
        }
        return getItem.call(this, key)
    }
    const collect = (value) => {
        if (Array.isArray(value)) value.forEach(collect)
        else if (value && typeof value === 'object') {
            if (typeof value.event === 'string' && value.event.startsWith('daily_test_')) {
                const properties = value.properties || {}
                const safe = {}
                for (const key of [
                    'test_id',
                    'enrollment_id',
                    'variant',
                    'rendered_variant',
                    'assignment_version',
                    'eligibility_at',
                    'assignment_status',
                    'entry_source',
                    'release_sha',
                    'resumed',
                ]) {
                    safe[key] = properties[key]
                }
                window.__dailyEvents.push({ event: value.event, properties: safe })
            }
        }
    }
    JSON.stringify = (value, ...args) => {
        collect(value)
        return stringify(value, ...args)
    }
    window.fetch = async (input, init = {}) => {
        const url = new URL(typeof input === 'string' ? input : input.url, location.href)
        if (url.origin === location.origin && url.pathname.startsWith('/ingest')) {
            if (url.pathname.includes('flags') || url.pathname.includes('decide')) {
                return new Response(stringify({ featureFlags: flags(), featureFlagPayloads: {} }), {
                    headers: { 'Content-Type': 'application/json' },
                })
            }
            return new Response('{}', { headers: { 'Content-Type': 'application/json' } })
        }
        if (url.origin !== location.origin && !/supabase/.test(url.hostname)) {
            return new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } })
        }
        return originalFetch(input, init)
    }
    window.fetch.__isolated = true
    window.WebSocket = class extends EventTarget {
        static CONNECTING = 0
        static OPEN = 1
        static CLOSING = 2
        static CLOSED = 3
        readyState = 1
        constructor(url) {
            super()
            this.url = url
            queueMicrotask(() => this.onopen?.(new Event('open')))
        }
        send() {}
        close() {
            this.readyState = 3
        }
    }
    window.WebSocket.__isolated = true
    navigator.sendBeacon = () => false
    navigator.sendBeacon.__isolated = true
    window.XMLHttpRequest = class {
        open() {
            throw new Error('Synthetic XHR blocked')
        }
    }
    window.XMLHttpRequest.__isolated = true
    window.__guardedNavigation = []
    window.navigation?.addEventListener('navigate', (event) => {
        const url = new URL(event.destination.url)
        if (!location.pathname.startsWith('/dashboard') && url.pathname.startsWith('/dashboard')) {
            window.__guardedNavigation.push(url.pathname + url.search)
            event.preventDefault()
        }
    })
    localStorage.setItem('lp-consent', 'accepted')
})()
