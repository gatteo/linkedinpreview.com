import assert from 'node:assert/strict'
import test from 'node:test'

import { loadTS } from './helpers/component-harness.mjs'

const { fetchBilling } = await loadTS('lib/supabase/billing.ts', {
    '@/lib/billing': await loadTS('lib/billing.ts'),
})

function client(result) {
    const calls = []
    const query = {
        from(table) {
            calls.push(['from', table])
            return query
        },
        select(columns) {
            calls.push(['select', columns])
            return query
        },
        eq(key, value) {
            calls.push(['eq', key, value])
            return query
        },
        async maybeSingle() {
            return result
        },
    }
    return { query, calls }
}

for (const plan of ['free', 'pro', 'lifetime']) {
    test(`billing ${plan} read explicitly scopes and validates expected user`, async () => {
        const c = client({ data: { user_id: 'current', plan }, error: null })
        const billing = await fetchBilling(c.query, 'current')
        assert.equal(billing.plan, plan)
        assert.deepEqual(
            c.calls.find(([kind]) => kind === 'eq'),
            ['eq', 'user_id', 'current'],
        )
        assert.ok(
            c.calls
                .find(([kind]) => kind === 'select')[1]
                .split(', ')
                .includes('user_id'),
        )
    })
}

test('wrong-account and ownerless rows reject instead of verified billing', async () => {
    for (const data of [{ user_id: 'preceding', plan: 'free' }, { plan: 'pro' }]) {
        await assert.rejects(fetchBilling(client({ data, error: null }).query, 'current'), /Billing identity mismatch/)
    }
})

test('own absent row stays free; read errors remain failures', async () => {
    const missing = client({ data: null, error: null })
    assert.equal((await fetchBilling(missing.query, 'current')).plan, 'free')
    assert.deepEqual(missing.calls.at(-1), ['eq', 'user_id', 'current'])
    await assert.rejects(
        fetchBilling(client({ data: null, error: Error('synthetic read failure') }).query, 'current'),
        /synthetic read failure/,
    )
})
