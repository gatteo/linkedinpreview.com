;(() => {
    const originalFetch = window.fetch.bind(window)
    const USER_ID = '11111111-1111-4111-8111-111111111111'
    const user = {
        id: USER_ID,
        aud: 'authenticated',
        role: 'authenticated',
        email: '',
        is_anonymous: true,
        app_metadata: {},
        user_metadata: {},
        created_at: '2026-10-05T00:00:00Z',
    }
    const token = [
        btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
        btoa(
            JSON.stringify({
                sub: USER_ID,
                exp: Math.floor(Date.now() / 1000) + 3600,
                aud: 'authenticated',
                role: 'authenticated',
            }),
        ),
        'synthetic-signature',
    ].join('.')
    const session = {
        access_token: token,
        refresh_token: 'synthetic-fixture-only',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user,
    }
    const response = (body, status = 200) =>
        new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    const read = () => JSON.parse(localStorage.getItem('lin108-fixture-drafts') || '[]')
    const write = (rows) => localStorage.setItem('lin108-fixture-drafts', JSON.stringify(rows))
    window.__fixtureRequests = []
    window.__fixtureErrors = []
    addEventListener('error', (event) => window.__fixtureErrors.push(event.message))
    addEventListener('unhandledrejection', (event) => window.__fixtureErrors.push(String(event.reason)))
    window.fetch = async (input, init = {}) => {
        const url = new URL(typeof input === 'string' ? input : input.url, location.href)
        const method = init.method || (input instanceof Request ? input.method : 'GET')
        if (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in')) {
            window.__fixtureRequests.push({ path: url.pathname, method, fixture: true })
            if (url.pathname.includes('/auth/v1/signup') || url.pathname.includes('/auth/v1/token'))
                return response(session)
            if (url.pathname.includes('/auth/v1/user')) return response(user)
            if (url.pathname.includes('/rest/v1/drafts')) {
                let rows = read()
                const id = url.searchParams.get('id')?.replace(/^eq\./, '')
                if (method === 'POST') {
                    const raw = JSON.parse(init.body)
                    const row = Array.isArray(raw) ? raw[0] : raw
                    rows.push({
                        ...row,
                        label: row.label ?? null,
                        scheduled_at: null,
                        published_at: null,
                        linkedin_post_url: null,
                        publish_error: null,
                    })
                    write(rows)
                    return response(rows.at(-1), 201)
                }
                if (method === 'PATCH') {
                    const patch = JSON.parse(init.body)
                    rows = rows.map((row) => (row.id === id ? { ...row, ...patch } : row))
                    write(rows)
                    return response(rows.find((row) => row.id === id) ?? null)
                }
                if (method === 'DELETE') return response([])
                const single = new Headers(init.headers).get('accept')?.includes('object')
                return response(single ? (rows.find((row) => row.id === id) ?? null) : rows)
            }
            if (url.pathname.includes('/rest/v1/')) return response([])
            return response({})
        }
        if (url.origin === location.origin && url.pathname.startsWith('/api/')) {
            window.__fixtureRequests.push({ path: url.pathname, method, fixture: true })
            if (url.pathname === '/api/linkedin/status') return response({ connected: false, available: false })
            if (url.pathname === '/api/billing/checkout') {
                window.__fixtureCheckout = JSON.parse(init.body)
                return response({ code: 'SYNTHETIC_CHECKOUT_BLOCKED' }, 503)
            }
            if (url.pathname === '/api/analyze' || url.pathname === '/api/suggestions')
                return response({ code: 'SYNTHETIC_PROVIDER_BLOCKED' }, 429)
            return response({})
        }
        if (url.pathname.startsWith('/ingest') || /posthog|featurebase|tally|stripe|linkedin\.com/.test(url.hostname))
            return response({})
        return originalFetch(input, init)
    }
    const originalWebSocket = window.WebSocket
    window.WebSocket = class extends EventTarget {
        static CONNECTING = 0
        static OPEN = 1
        static CLOSING = 2
        static CLOSED = 3
        readyState = 1
        constructor(url) {
            super()
            this.url = url
            if (!/supabase/.test(url)) return new originalWebSocket(url)
            queueMicrotask(() => this.onopen?.(new Event('open')))
        }
        send() {}
        close() {
            this.readyState = 3
        }
    }
})()
