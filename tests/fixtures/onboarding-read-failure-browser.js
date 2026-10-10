// Install after draft-first-browser.js, before application scripts.
;(() => {
    const originalFetch = window.fetch
    const scenario = JSON.parse(localStorage.getItem('lin220-read-scenario') || '{}')
    const response = (body, status = 200) =>
        new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    window.__settingsReads = []
    window.__settingsWrites = []
    window.fetch = async (input, init = {}) => {
        const url = new URL(typeof input === 'string' ? input : input.url, location.href)
        const method = init.method || (input instanceof Request ? input.method : 'GET')
        const table = url.pathname.match(/^\/rest\/v1\/(branding|strategy)$/)?.[1]
        if (table && /\.supabase\.(co|in)$/.test(url.hostname)) {
            const mode = scenario[table] || 'missing'
            window.__fixtureRequests.push({ path: url.pathname, method, fixture: true })
            if (method !== 'GET') {
                window.__settingsWrites.push({ table, method, body: JSON.parse(init.body) })
                return response({})
            }
            window.__settingsReads.push({ table, mode })
            if (mode === 'fail') return response({ code: '42501', message: 'Synthetic read failure' }, 403)
            if (mode === 'missing') return response({ code: 'PGRST116', message: 'Synthetic missing row' }, 406)
            return response({
                data:
                    table === 'branding'
                        ? {
                              profile: { name: 'Synthetic retained profile' },
                              knowledgeBase: { notes: 'Synthetic retained notes' },
                              ...(mode === 'completed' ? { meta: { onboardedAt: '2026-01-01T00:00:00Z' } } : {}),
                              ...(mode === 'legacy' ? { role: 'founder' } : {}),
                          }
                        : { ...(mode === 'legacy' ? { completedAt: '2026-01-01T00:00:00Z' } : {}) },
            })
        }
        return originalFetch(input, init)
    }
    window.__lin220SettingsFixture = true
})()
