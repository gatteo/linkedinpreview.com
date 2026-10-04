import assert from 'node:assert/strict'
import test from 'node:test'

import { handleRecoveryClaim } from '../lib/billing/recovery-claim-handler.ts'

const ENTITLEMENT_ID = '10000000-0000-0000-0000-000000000001'
const CHALLENGE_ID = '20000000-0000-0000-0000-000000000002'
const ORIGINAL_OWNER_ID = '00000000-0000-0000-0000-0000000000a1'
const TARGET_USER_ID = '00000000-0000-0000-0000-0000000000b2'
const ATTACKER_USER_ID = '00000000-0000-0000-0000-0000000000c3'

function claimRequest(body = { entitlementId: ENTITLEMENT_ID, challengeId: CHALLENGE_ID }) {
    return new Request('http://localhost/api/billing/recovery/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    })
}

test('rejects a recovery claim without an authenticated target account', async () => {
    let rpcCalls = 0
    const response = await handleRecoveryClaim(claimRequest(), {
        getUser: async () => null,
        claimEntitlement: async () => {
            rpcCalls += 1
            return { data: null, error: null }
        },
    })

    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), { error: 'Authentication required' })
    assert.equal(rpcCalls, 0)
})

test('rejects a malformed authenticated target ID before the service-role RPC', async () => {
    let rpcCalls = 0
    const response = await handleRecoveryClaim(claimRequest(), {
        getUser: async () => ({ id: 'not-a-uuid' }),
        claimEntitlement: async () => {
            rpcCalls += 1
            return { data: true, error: null }
        },
    })

    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), { error: 'Authentication required' })
    assert.equal(rpcCalls, 0)
})

test('returns a generic unavailable response when authentication lookup fails', async () => {
    let rpcCalls = 0
    const response = await handleRecoveryClaim(claimRequest(), {
        getUser: async () => {
            throw new Error('Supabase unavailable')
        },
        claimEntitlement: async () => {
            rpcCalls += 1
            return { data: true, error: null }
        },
    })

    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: 'Recovery service unavailable' })
    assert.equal(rpcCalls, 0)
})

test('returns a generic unavailable response when the claim RPC rejects', async () => {
    const response = await handleRecoveryClaim(claimRequest(), {
        getUser: async () => ({ id: TARGET_USER_ID }),
        claimEntitlement: async () => {
            throw new Error('PostgREST unavailable')
        },
    })

    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: 'Recovery service unavailable' })
})

test('binds a recovery claim to the authenticated attacker instead of a forged body target', async () => {
    const rpcCalls = []
    const response = await handleRecoveryClaim(
        claimRequest({
            entitlementId: ENTITLEMENT_ID,
            challengeId: CHALLENGE_ID,
            toUserId: TARGET_USER_ID,
        }),
        {
            getUser: async () => ({ id: ATTACKER_USER_ID }),
            claimEntitlement: async (args) => {
                rpcCalls.push(args)
                return { data: null, error: new Error('Recovery proof target account mismatch') }
            },
        },
    )

    assert.equal(response.status, 409)
    assert.deepEqual(await response.json(), { error: 'Recovery claim unavailable' })
    assert.deepEqual(rpcCalls, [
        {
            p_entitlement_id: ENTITLEMENT_ID,
            p_to_user_id: ATTACKER_USER_ID,
            p_challenge_id: CHALLENGE_ID,
        },
    ])
})

test('claims an entitlement once for the authenticated recovery target', async () => {
    const rpcCalls = []
    const response = await handleRecoveryClaim(claimRequest(), {
        getUser: async () => ({ id: TARGET_USER_ID }),
        claimEntitlement: async (args) => {
            rpcCalls.push(args)
            return { data: true, error: null }
        },
    })

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { claimed: true })
    assert.deepEqual(rpcCalls, [
        {
            p_entitlement_id: ENTITLEMENT_ID,
            p_to_user_id: TARGET_USER_ID,
            p_challenge_id: CHALLENGE_ID,
        },
    ])
})

test('rejects JSON null before the service-role RPC', async () => {
    let rpcCalls = 0
    const response = await handleRecoveryClaim(
        new Request('http://localhost/api/billing/recovery/claim', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: 'null',
        }),
        {
            getUser: async () => ({ id: TARGET_USER_ID }),
            claimEntitlement: async () => {
                rpcCalls += 1
                return { data: true, error: null }
            },
        },
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'Invalid recovery claim' })
    assert.equal(rpcCalls, 0)
})

test('rejects malformed recovery claim identifiers before the service-role RPC', async () => {
    let rpcCalls = 0
    const response = await handleRecoveryClaim(
        claimRequest({ entitlementId: 'not-a-uuid', challengeId: CHALLENGE_ID }),
        {
            getUser: async () => ({ id: TARGET_USER_ID }),
            claimEntitlement: async () => {
                rpcCalls += 1
                return { data: true, error: null }
            },
        },
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'Invalid recovery claim' })
    assert.equal(rpcCalls, 0)
})

test('rejects an exact replay without reporting another successful recovery', async () => {
    let attempts = 0
    const dependencies = {
        getUser: async () => ({ id: TARGET_USER_ID }),
        claimEntitlement: async () => {
            attempts += 1
            if (attempts === 1) return { data: true, error: null }
            return { data: null, error: new Error('Fresh matching proof required') }
        },
    }

    const first = await handleRecoveryClaim(claimRequest(), dependencies)
    const replay = await handleRecoveryClaim(claimRequest(), dependencies)

    assert.equal(first.status, 200)
    assert.deepEqual(await first.json(), { claimed: true })
    assert.equal(replay.status, 409)
    assert.deepEqual(await replay.json(), { error: 'Recovery claim unavailable' })
    assert.equal(attempts, 2)
    assert.notEqual(ORIGINAL_OWNER_ID, TARGET_USER_ID)
})
