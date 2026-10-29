import assert from 'node:assert/strict'
import test from 'node:test'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

import * as schemas from '../app/api/analytics/insights/route.schema.ts'
import * as aiConfig from '../config/ai.ts'
import { loadTS } from './helpers/component-harness.mjs'

const blockedFetch = async () => assert.fail('Live transport is forbidden in this offline suite')
const prompts = await loadTS('config/prompts.ts')
const { checkRateLimit } = await loadTS(
    'lib/rate-limit.ts',
    { '@/config/ai': aiConfig },
    { process: { env: { NODE_ENV: 'test' } } },
)
const fixture = (action = null) => ({
    headline: 'Synthetic trajectory',
    insights: [{ kind: 'opportunity', title: 'Synthetic title', detail: 'Synthetic detail', action }],
    nextPost: { recommendation: 'Synthetic recommendation' },
})

async function serialize(schema) {
    const stop = new Error('Offline serialization stop')
    let format
    let calls = 0
    const provider = createOpenAI({
        apiKey: 'synthetic-unused',
        fetch: async (_url, options) => {
            calls += 1
            const body = JSON.parse(options.body)
            format = body.text?.format ?? body.response_format?.json_schema
            throw stop
        },
    })
    const original = globalThis.fetch
    globalThis.fetch = blockedFetch
    try {
        await assert.rejects(
            generateObject({
                model: provider('gpt-4o-mini'),
                schema,
                prompt: 'Offline synthetic schema',
                maxRetries: 0,
            }),
            (error) => error === stop,
        )
    } finally {
        globalThis.fetch = original
    }
    assert.equal(calls, 1)
    assert.equal(format.strict, true)
    return format.schema
}

function assertStrict(node) {
    if (!node || typeof node !== 'object') return
    if (node.type === 'object') {
        assert.deepEqual([...node.required].sort(), Object.keys(node.properties).sort())
        assert.equal(node.additionalProperties, false)
    }
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(assertStrict)
        else assertStrict(value)
    }
}

test('installed SDK reproduces legacy action omission and serializes all provider object properties as required', async () => {
    const legacy = await serialize(schemas.insightsSchema)
    assert.deepEqual(legacy.properties.insights.items.required, ['kind', 'title', 'detail'])
    assert.ok(Object.hasOwn(legacy.properties.insights.items.properties, 'action'))
    const provider = await serialize(schemas.providerInsightsSchema)
    assertStrict(provider)
    assert.deepEqual(provider.properties.insights.items.properties.action.anyOf, [
        { type: 'string', maxLength: 200 },
        { type: 'null' },
    ])
    assert.equal(provider.properties.insights.minItems, 1)
    assert.equal(provider.properties.insights.maxItems, 6)
})

test('public actions remain optional strings; provider actions are required nullable strings with identical bounds', () => {
    const missing = fixture()
    delete missing.insights[0].action
    assert.equal(schemas.insightsSchema.safeParse(missing).success, true)
    assert.equal(schemas.insightsSchema.safeParse(fixture()).success, false)
    assert.equal(schemas.providerInsightsSchema.safeParse(missing).success, false)
    assert.equal(schemas.providerInsightsSchema.safeParse(fixture()).success, true)
    for (const schema of [schemas.insightsSchema, schemas.providerInsightsSchema]) {
        assert.equal(schema.safeParse(fixture('')).success, true)
        assert.equal(schema.safeParse(fixture('x'.repeat(200))).success, true)
        assert.equal(schema.safeParse(fixture('x'.repeat(201))).success, false)
        assert.equal(schema.safeParse({ ...fixture('step'), insights: [] }).success, false)
        assert.equal(
            schema.safeParse({ ...fixture('step'), insights: Array(7).fill(fixture('step').insights[0]) }).success,
            false,
        )
    }
    assert.match(prompts.INSIGHTS_SYSTEM_PROMPT, /using null when there is no next step/)
})

async function execute({
    user = true,
    allowed = true,
    plan = 'free',
    publishedCount = 3,
    providerResult = fixture(),
    failure,
    digestFailure = false,
    persistError = false,
    cached = null,
    method = 'POST',
} = {}) {
    const counters = { auth: 0, usage: 0, provider: 0, persisted: [] }
    const client = {
        auth: {
            getUser: async () => {
                counters.auth += 1
                return { data: { user: user ? { id: 'synthetic-user' } : null } }
            },
        },
        from: (table) => {
            if (table === 'billing')
                return { select: () => ({ maybeSingle: async () => ({ data: { plan }, error: null }) }) }
            assert.equal(table, 'analytics_insights')
            return {
                select: (columns) => {
                    assert.equal(columns, 'data, updated_at')
                    return {
                        eq: (key, value) => {
                            assert.equal(key, 'user_id')
                            assert.equal(value, 'synthetic-user')
                            return { maybeSingle: async () => ({ data: cached }) }
                        },
                    }
                },
                upsert: async (data, options) => {
                    assert.deepEqual(JSON.parse(JSON.stringify(options)), { onConflict: 'user_id' })
                    counters.persisted.push(JSON.parse(JSON.stringify(data)))
                    return { error: persistError ? { message: 'Synthetic persistence failure' } : null }
                },
            }
        },
        rpc: async (name, args) => {
            counters.usage += 1
            assert.equal(name, 'check_and_record_usage')
            assert.equal(args.p_action, 'insights')
            assert.equal(args.p_limit, aiConfig.aiLimitsForPlan(plan).insights)
            return { data: { allowed, remaining: allowed ? 1 : 0, reset_at: '2099-01-01T00:00:00Z' }, error: null }
        },
    }
    const route = await loadTS(
        'app/api/analytics/insights/route.ts',
        {
            '@/env.mjs': { env: { LLM_API_KEY: 'synthetic-unused', LLM_MODEL: 'synthetic-model' } },
            '@/config/ai': aiConfig,
            '@/config/prompts': prompts,
            '@/lib/analytics/digest': {
                buildAnalyticsDigest: (_drafts, _metrics, _content, _now, offset) => {
                    assert.equal(offset, 60)
                    return { synthetic: true }
                },
            },
            '@/lib/rate-limit': { checkRateLimit },
            '@/lib/supabase/drafts': {
                fetchDrafts: async () => {
                    if (digestFailure) throw new Error('Synthetic load failure')
                    return Array(publishedCount).fill({ status: 'published' })
                },
            },
            '@/lib/supabase/post-metrics': { fetchPostMetrics: async () => [] },
            '@/lib/supabase/published-posts': { fetchPublishedPostsContent: async () => [] },
            '@/lib/supabase/server': { createClient: async () => client },
            './route.schema': schemas,
            '@ai-sdk/openai': {
                createOpenAI: () => (model) => {
                    assert.equal(model, 'synthetic-model')
                    return {}
                },
            },
            'ai': {
                generateObject: async (options) => {
                    counters.provider += 1
                    assert.equal(options.schema, schemas.providerInsightsSchema)
                    assert.equal(options.system, prompts.INSIGHTS_SYSTEM_PROMPT)
                    assert.equal(options.prompt, prompts.insightsUserPrompt({ synthetic: true }))
                    if (failure) throw failure
                    return { object: options.schema.parse(providerResult) }
                },
            },
        },
        { fetch: blockedFetch, console: { ...console, error() {} } },
    )
    const response =
        method === 'GET'
            ? await route.GET()
            : await route.POST(
                  new Request('https://synthetic.invalid/api/analytics/insights', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ tzOffsetMinutes: 60 }),
                  }),
              )
    return { response, payload: await response.json(), counters }
}

for (const action of [null, '', 'Synthetic next step', '  ']) {
    test(`POST normalizes only null action before fixture persistence and response: ${JSON.stringify(action)}`, async () => {
        const input = fixture(action)
        const expected = fixture(action)
        if (action === null) delete expected.insights[0].action
        const normalized = schemas.normalizeProviderInsights(input)
        assert.deepEqual(normalized, expected)
        assert.deepEqual(input, fixture(action))
        const { response, payload, counters } = await execute({ providerResult: input })
        assert.equal(response.status, 200)
        assert.equal(payload.success, true)
        assert.deepEqual(payload.insights, expected)
        assert.equal(schemas.insightsSchema.safeParse(payload.insights).success, true)
        assert.equal(counters.persisted.length, 1)
        assert.deepEqual(counters.persisted[0].data, expected)
        assert.equal(counters.persisted[0].user_id, 'synthetic-user')
        assert.equal(Date.parse(counters.persisted[0].updated_at), payload.generatedAt)
    })
}

for (const plan of ['free', 'pro', 'lifetime']) {
    test(`POST retains ${plan} insights entitlement through actual limiter`, async () => {
        const { response, counters } = await execute({ plan })
        assert.equal(response.status, 200)
        assert.equal(counters.usage, 1)
    })
}

for (const method of ['GET', 'POST']) {
    test(`${method} retains unauthenticated 401 without usage/provider/persistence`, async () => {
        const { response, payload, counters } = await execute({ user: false, method })
        assert.equal(response.status, 401)
        assert.equal(payload.code, 'AUTH_REQUIRED')
        assert.deepEqual(counters, { auth: 1, usage: 0, provider: 0, persisted: [] })
    })
}

for (const config of [
    { publishedCount: 2, status: 200 },
    { digestFailure: true, status: 500 },
    { allowed: false, status: 429 },
]) {
    test(`POST retains precondition without provider or persistence: ${JSON.stringify(config)}`, async () => {
        const { response, payload, counters } = await execute(config)
        assert.equal(response.status, config.status)
        assert.equal(counters.provider, 0)
        assert.equal(counters.persisted.length, 0)
        assert.equal(counters.usage, config.status === 429 ? 1 : 0)
        if (config.status === 200) assert.deepEqual(payload, { success: true, notEnoughData: true, publishedCount: 2 })
        if (config.status === 429)
            assert.deepEqual(payload, {
                error: 'Daily insights limit reached',
                code: 'RATE_LIMITED',
                action: 'insights',
                resetAt: '2099-01-01T00:00:00Z',
                remaining: 0,
            })
    })
}

for (const config of [
    { failure: new Error('Synthetic rejection') },
    { providerResult: fixture(123) },
    { providerResult: { ...fixture(), insights: [{ kind: 'win', title: 'Synthetic', detail: 'Synthetic' }] } },
]) {
    test(`POST generation failure retains 500 without persistence: ${JSON.stringify(config)}`, async () => {
        const { response, payload, counters } = await execute(config)
        assert.equal(response.status, 500)
        assert.deepEqual(payload, { error: 'Failed to generate insights', code: 'GENERATION_FAILED' })
        assert.equal(counters.persisted.length, 0)
    })
}

test('POST persistence failure remains non-fatal with normalized output', async () => {
    const { response, payload } = await execute({ persistError: true })
    assert.equal(response.status, 200)
    assert.equal(Object.hasOwn(payload.insights.insights[0], 'action'), false)
})

for (const cached of [
    null,
    {
        data: {
            headline: 'Legacy cached',
            insights: [{ kind: 'win', title: 'Legacy', detail: 'Legacy' }],
            nextPost: { recommendation: 'Legacy' },
        },
        updated_at: '2026-01-01T00:00:00Z',
    },
]) {
    test(`GET preserves cached/absent public contract: ${JSON.stringify(cached)}`, async () => {
        const { response, payload, counters } = await execute({ method: 'GET', cached })
        assert.equal(response.status, 200)
        assert.deepEqual(payload, {
            insights: cached?.data ?? null,
            generatedAt: cached ? Date.parse(cached.updated_at) : null,
        })
        assert.deepEqual(counters, { auth: 1, usage: 0, provider: 0, persisted: [] })
    })
}
