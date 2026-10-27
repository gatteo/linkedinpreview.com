import assert from 'node:assert/strict'
import test from 'node:test'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import * as lucide from 'lucide-react'

import * as schemas from '../app/api/carousel/edit/route.schema.ts'
import * as aiConfig from '../config/ai.ts'
import { loadTS } from './helpers/component-harness.mjs'

const blockedFetch = async () => assert.fail('Live transport is forbidden in this offline suite')
const icons = await loadTS('lib/carousel/icons.ts', { 'lucide-react': lucide })
const prompts = await loadTS('config/carousel-prompts.ts', { '@/lib/carousel/icons': icons })
const { checkRateLimit } = await loadTS(
    'lib/rate-limit.ts',
    { '@/config/ai': aiConfig },
    { process: { env: { NODE_ENV: 'test' } } },
)

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

test('actual SDK reproduces the public optional-body mismatch and serializes a strict-compatible provider schema', async () => {
    const legacy = await serialize(schemas.slideSchema)
    assert.deepEqual(legacy.required, ['headline'])
    assert.ok(Object.hasOwn(legacy.properties, 'body'))
    const provider = await serialize(schemas.providerSlideSchema)
    assert.deepEqual([...provider.required].sort(), Object.keys(provider.properties).sort())
    assert.equal(provider.additionalProperties, false)
    assert.deepEqual(provider.properties.body.type, ['string', 'null'])
    assert.equal(provider.properties.headline.type, 'string')
})

test('public input/output remain optional-string contracts, not nullable contracts', () => {
    assert.equal(schemas.bodySchema.safeParse({ action: 'rewrite', headline: 'Synthetic input' }).success, true)
    assert.equal(
        schemas.bodySchema.safeParse({ action: 'rewrite', headline: 'Synthetic input', body: null }).success,
        false,
    )
    assert.equal(schemas.slideSchema.safeParse({ headline: 'Synthetic output' }).success, true)
    assert.equal(schemas.slideSchema.safeParse({ headline: 'Synthetic output', body: null }).success, false)
    assert.equal(schemas.providerSlideSchema.safeParse({ headline: 'Synthetic output' }).success, false)
    assert.equal(schemas.providerSlideSchema.safeParse({ headline: 'Synthetic output', body: null }).success, true)
    assert.match(prompts.CAROUSEL_EDIT_SYSTEM, /Include body, using null/)
})

async function execute({
    action = 'rewrite',
    fixture = { headline: 'Synthetic edited headline', body: null },
    user = true,
    allowed = true,
    plan = 'free',
    failure,
    body = {
        action,
        headline: 'Synthetic original',
        deckSummary: 'Synthetic deck',
        brandingContext: 'Synthetic voice',
    },
} = {}) {
    const counters = { auth: 0, usage: 0, provider: 0, writes: 0 }
    const client = {
        auth: {
            getUser: async () => {
                counters.auth += 1
                return { data: { user: user ? { id: 'synthetic-user' } : null } }
            },
        },
        from: (table) => {
            assert.equal(table, 'billing')
            const forbid = () => {
                counters.writes += 1
                assert.fail('No customer or billing writes')
            }
            return {
                select: () => ({ maybeSingle: async () => ({ data: { plan }, error: null }) }),
                insert: forbid,
                update: forbid,
                upsert: forbid,
                delete: forbid,
            }
        },
        rpc: async (name, args) => {
            counters.usage += 1
            assert.equal(name, 'check_and_record_usage')
            assert.equal(args.p_action, 'quickAction')
            assert.equal(args.p_limit, aiConfig.aiLimitsForPlan(plan).quickAction)
            return { data: { allowed, remaining: allowed ? 1 : 0, reset_at: '2099-01-01T00:00:00Z' }, error: null }
        },
    }
    const route = await loadTS(
        'app/api/carousel/edit/route.ts',
        {
            '@/env.mjs': { env: { LLM_API_KEY: 'synthetic-unused', LLM_MODEL: 'synthetic-model' } },
            '@/config/ai': aiConfig,
            '@/config/carousel-prompts': prompts,
            '@/lib/rate-limit': { checkRateLimit },
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
                    assert.equal(options.schema, schemas.providerSlideSchema)
                    assert.equal(options.system, prompts.CAROUSEL_EDIT_SYSTEM)
                    assert.equal(options.prompt, prompts.carouselEditUserPrompt(body))
                    if (failure) throw failure
                    return { object: options.schema.parse(fixture) }
                },
            },
        },
        { fetch: blockedFetch, console: { ...console, error() {} } },
    )
    const response = await route.POST(
        new Request('https://synthetic.invalid/api/carousel/edit', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: typeof body === 'string' ? body : JSON.stringify(body),
        }),
    )
    return { response, payload: await response.json(), counters }
}

for (const action of ['rewrite', 'shorten', 'punchup', 'regenerate']) {
    for (const body of [null, '', 'Synthetic supporting line']) {
        test(`actual POST ${action} preserves headline and ${JSON.stringify(body)} normalization`, async () => {
            const fixture = { headline: 'Synthetic edited headline', body }
            const { response, payload, counters } = await execute({ action, fixture })
            assert.equal(response.status, 200)
            assert.deepEqual(payload, body === null ? { headline: fixture.headline } : fixture)
            assert.equal(schemas.slideSchema.safeParse(payload).success, true)
            assert.equal(Object.hasOwn(payload, 'body'), body !== null)
            assert.deepEqual(counters, { auth: 1, usage: 1, provider: 1, writes: 0 })
        })
    }
}

for (const plan of ['free', 'pro', 'lifetime']) {
    test(`actual limiter retains existing ${plan} quickAction entitlement`, async () => {
        const { response, counters } = await execute({ plan })
        assert.equal(response.status, 200)
        assert.equal(counters.usage, 1)
    })
}

for (const config of [
    { body: '{', status: 400 },
    { body: { action: 'unknown', headline: 'Synthetic' }, status: 400 },
    { body: { action: 'rewrite', headline: '' }, status: 400 },
    { body: { action: 'rewrite', headline: 'x'.repeat(2001) }, status: 400 },
    { body: { action: 'rewrite', headline: 'Synthetic', body: 'x'.repeat(4001) }, status: 400 },
    { user: false, status: 401 },
    { allowed: false, status: 429 },
]) {
    test(`actual POST retains ${config.status} precondition without provider execution: ${JSON.stringify(config).slice(0, 100)}`, async () => {
        const { response, payload, counters } = await execute(config)
        assert.equal(response.status, config.status)
        assert.equal(counters.provider, 0)
        assert.equal(counters.usage, config.status === 429 ? 1 : 0)
        assert.equal(counters.writes, 0)
        if (config.status === 401) assert.equal(payload.code, 'AUTH_REQUIRED')
        if (config.status === 429)
            assert.deepEqual(payload, {
                error: 'Daily quickAction limit reached',
                code: 'RATE_LIMITED',
                action: 'quickAction',
                resetAt: '2099-01-01T00:00:00Z',
                remaining: 0,
            })
    })
}

for (const config of [
    { failure: new Error('Synthetic provider rejection') },
    { failure: 'Synthetic non-Error rejection' },
    { fixture: { headline: 'Synthetic', body: 123 } },
    { fixture: { headline: 'Synthetic' } },
]) {
    test(`actual POST retains 500 failure without success/customer writes: ${JSON.stringify(config)}`, async () => {
        const { response, payload, counters } = await execute(config)
        assert.equal(response.status, 500)
        assert.deepEqual(payload, { error: 'Failed to edit slide', code: 'GENERATION_FAILED' })
        assert.deepEqual(counters, { auth: 1, usage: 1, provider: 1, writes: 0 })
    })
}
