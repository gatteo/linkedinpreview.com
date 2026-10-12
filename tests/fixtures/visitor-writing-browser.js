;(() => {
    // Synthetic auth cookies stay in this document, never in server requests.
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')
    const shadow = new Map()
    Object.defineProperty(document, 'cookie', {
        configurable: true,
        get() {
            const native = descriptor.get
                .call(document)
                .split('; ')
                .filter((part) => !part.startsWith('sb-'))
            return [...native, ...shadow.values()].filter(Boolean).join('; ')
        },
        set(value) {
            const pair = value.split(';')[0]
            const name = pair.split('=')[0]
            if (name.startsWith('sb-')) {
                shadow.set(name, pair)
                return
            }
            descriptor.set.call(document, value)
        },
    })
    const fixtureFetch = window.fetch.bind(window)
    const response = (body, status = 200) =>
        new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    window.fetch = async (input, init = {}) => {
        const url = new URL(typeof input === 'string' ? input : input.url, location.href)
        const mode = localStorage.getItem('lin237-fixture-mode') || 'free'
        if (/\.supabase\.(co|in)$/.test(url.hostname) && url.pathname === '/rest/v1/billing') {
            window.__fixtureRequests.push({ path: url.pathname, method: 'GET', fixture: true, mode })
            if (mode === 'unknown') return response({ code: 'SYNTHETIC_UNAVAILABLE' }, 503)
            return response({
                user_id: '11111111-1111-4111-8111-111111111111',
                plan: mode === 'paid' ? 'pro' : 'free',
                stripe_customer_id: null,
                stripe_subscription_id: null,
            })
        }
        if (url.origin === location.origin && url.pathname === '/api/chat') {
            window.__fixtureRequests.push({ path: url.pathname, method: 'POST', fixture: true, mode })
            if (mode === 'ai_failure') return response({ code: 'PROVIDER_UNAVAILABLE' }, 503)
            const text =
                mode === 'refusal'
                    ? '[REFUSED] Synthetic refusal'
                    : 'Synthetic writing-help preview. This is offline fixture text, not a provider generation. Testing accepted insertion, visible preview and successful clipboard copy without any customer or provider action.'
            const chunks =
                [
                    { type: 'start', messageId: 'synthetic-assistant' },
                    { type: 'text-start', id: 'synthetic-text' },
                    { type: 'text-delta', id: 'synthetic-text', delta: text },
                    { type: 'text-end', id: 'synthetic-text' },
                    { type: 'finish', finishReason: 'stop' },
                ]
                    .map((part) => `data: ${JSON.stringify(part)}\n\n`)
                    .join('') + 'data: [DONE]\n\n'
            return new Response(chunks, {
                headers: { 'Content-Type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' },
            })
        }
        if (url.origin === location.origin && url.pathname === '/api/billing/checkout') {
            window.__fixtureRequests.push({ path: url.pathname, method: 'POST', fixture: true })
            window.__fixtureCheckout = JSON.parse(init.body)
            return response({ code: 'SYNTHETIC_CHECKOUT_BLOCKED' }, 503)
        }
        if (url.origin !== location.origin && !/\.supabase\.(co|in)$/.test(url.hostname)) return response({}, 503)
        return fixtureFetch(input, init)
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
    window.XMLHttpRequest = class {
        open() {
            throw Error('Contained fixture blocks XHR')
        }
    }
    window.XMLHttpRequest.__isolated = true
    navigator.sendBeacon = () => false
    navigator.sendBeacon.__isolated = true
    window.navigation?.addEventListener('navigate', (event) => {
        const url = new URL(event.destination.url)
        if (url.origin !== location.origin) event.preventDefault()
    })
    window.__lin237Contained = true
})()
