import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import * as lucide from 'lucide-react'
import ts from 'typescript'

import * as schemas from '../app/api/carousel/generate/route.schema.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const blockedFetch = async () => {
    assert.fail('Real network transport is forbidden in this offline test')
}

function loadActualModule(relativePath, mocks = {}, cache = new Map()) {
    const filename = path.resolve(root, relativePath)
    if (cache.has(filename)) return cache.get(filename).exports
    const loaded = { exports: {} }
    cache.set(filename, loaded)
    const source = readFileSync(filename, 'utf8')
    const compiled = ts.transpileModule(source, {
        compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        fileName: filename,
    }).outputText
    runInNewContext(compiled, {
        Request,
        Response,
        URL,
        fetch: blockedFetch,
        console: { ...console, error() {} },
        process: { env: { NODE_ENV: 'test' } },
        exports: loaded.exports,
        module: loaded,
        require(specifier) {
            if (specifier in mocks) return mocks[specifier]
            if (specifier === 'lucide-react') return lucide
            if (specifier === 'next/font/google') {
                // next/font is a build-time macro, not executable in the offline Node VM.
                return Object.fromEntries(
                    ['Bebas_Neue', 'DM_Sans', 'Inter', 'Montserrat', 'Playfair_Display', 'Space_Grotesk'].map(
                        (name) => [name, () => ({ variable: `synthetic-${name}` })],
                    ),
                )
            }
            if (specifier.startsWith('@/') || specifier.startsWith('.')) {
                const resolved = specifier.startsWith('@/')
                    ? path.join(root, specifier.slice(2))
                    : path.resolve(path.dirname(filename), specifier)
                return loadActualModule(path.relative(root, resolved + '.ts'), mocks, cache)
            }
            return require(specifier)
        },
    })
    return loaded.exports
}

const prompts = loadActualModule('config/carousel-prompts.ts')
const { documentFromAiSlides } = loadActualModule('lib/carousel/ai-map.ts')
const { checkRateLimit } = loadActualModule('lib/rate-limit.ts')

function syntheticDeck(count = 4, present = false) {
    return {
        themeSuggestion: present ? { vibe: 'Synthetic minimal' } : null,
        slides: Array.from({ length: count }, (_, index) => ({
            role: index === 0 ? 'hook' : index === count - 1 ? 'cta' : 'body',
            headline: `Synthetic slide ${index + 1}`,
            body: present ? `Synthetic supporting line ${index + 1}` : null,
            suggestedIcon: present ? 'Lightbulb' : null,
        })),
    }
}

function assertNoNulls(value) {
    assert.notEqual(value, null)
    if (typeof value === 'object') Object.values(value).forEach(assertNoNulls)
}

async function serializeStrictSchema(schema) {
    const stopped = new Error('Offline serialization transport stop')
    let calls = 0
    let format
    const provider = createOpenAI({
        apiKey: 'offline-unused',
        fetch: async (_url, options) => {
            calls += 1
            const request = JSON.parse(options.body)
            format = request.text?.format ?? request.response_format?.json_schema
            throw stopped
        },
    })
    const original = globalThis.fetch
    globalThis.fetch = blockedFetch
    try {
        await assert.rejects(
            generateObject({
                model: provider('gpt-4o-mini'),
                schema,
                prompt: 'Offline synthetic schema only',
                maxRetries: 0,
            }),
            (error) => error === stopped,
        )
    } finally {
        globalThis.fetch = original
    }
    assert.equal(calls, 1)
    assert.equal(format.strict, true)
    return format.schema
}

function objectNodes(value, path = '$', nodes = []) {
    if (!value || typeof value !== 'object') return nodes
    if (value.type === 'object') nodes.push({ path, value })
    for (const [key, child] of Object.entries(value)) objectNodes(child, `${path}/${key}`, nodes)
    return nodes
}

test('actual SDK strict serialization requires every property at every provider object node', async () => {
    const jsonSchema = await serializeStrictSchema(schemas.providerDeckSchema)
    const nodes = objectNodes(jsonSchema)
    assert.equal(nodes.length, 3)
    for (const { path, value } of nodes) {
        assert.deepEqual([...value.required].sort(), Object.keys(value.properties).sort(), path)
        assert.equal(value.additionalProperties, false, path)
    }
    const items = jsonSchema.properties.slides.items
    assert.deepEqual(items.properties.body.type, ['string', 'null'])
    assert.deepEqual(items.properties.suggestedIcon.type, ['string', 'null'])
    assert.ok(jsonSchema.properties.themeSuggestion.anyOf.some((item) => item.type === 'null'))
})

test('legacy public schema still accepts omitted optional fields without accepting nulls', () => {
    const publicDeck = { slides: syntheticDeck().slides.map(({ role, headline }) => ({ role, headline })) }
    assert.equal(schemas.deckSchema.safeParse(publicDeck).success, true)
    assert.equal(schemas.deckSchema.safeParse(syntheticDeck()).success, false)
    assert.equal(schemas.providerDeckSchema.safeParse(publicDeck).success, false)
})

for (const present of [false, true]) {
    test(`actual normalization and client document mapping preserve ${present ? 'present' : 'null/omitted'} values`, () => {
        const providerDeck = schemas.providerDeckSchema.parse(syntheticDeck(4, present))
        const publicDeck = schemas.normalizeProviderDeck(providerDeck)
        assertNoNulls(publicDeck)
        assert.equal(schemas.deckSchema.safeParse(publicDeck).success, true)
        assert.equal(Object.hasOwn(publicDeck, 'themeSuggestion'), present)
        for (const slide of publicDeck.slides) {
            assert.equal(Object.hasOwn(slide, 'body'), present)
            assert.equal(Object.hasOwn(slide, 'suggestedIcon'), present)
        }
        if (present) assert.deepEqual(publicDeck, providerDeck)
        const document = documentFromAiSlides(publicDeck.slides)
        assert.equal(document.slides.length, 4)
        assert.equal(document.slides[0].elements.filter((item) => item.type === 'text').length, present ? 2 : 1)
        assert.equal(
            document.slides[1].elements.some((item) => item.type === 'icon'),
            present,
        )
        assert.ok(document.slides[1].elements.some((item) => item.text === 'Synthetic slide 2'))
    })
}

test('empty strings are preserved, not converted to omitted fields', () => {
    const deck = syntheticDeck()
    deck.slides[1].body = ''
    deck.slides[1].suggestedIcon = ''
    const normalized = schemas.normalizeProviderDeck(schemas.providerDeckSchema.parse(deck))
    assert.equal(normalized.slides[1].body, '')
    assert.equal(normalized.slides[1].suggestedIcon, '')
})

test('mixed null and present values normalize independently without dropping the slide contract', () => {
    const deck = syntheticDeck()
    deck.themeSuggestion = { vibe: 'Synthetic minimal' }
    deck.slides[1].body = 'Keep this line'
    deck.slides[2].suggestedIcon = 'Lightbulb'
    const normalized = schemas.normalizeProviderDeck(schemas.providerDeckSchema.parse(deck))
    assertNoNulls(normalized)
    assert.deepEqual(normalized.themeSuggestion, deck.themeSuggestion)
    assert.equal(normalized.slides[1].body, 'Keep this line')
    assert.equal(Object.hasOwn(normalized.slides[1], 'suggestedIcon'), false)
    assert.equal(Object.hasOwn(normalized.slides[2], 'body'), false)
    assert.equal(normalized.slides[2].suggestedIcon, 'Lightbulb')
    assert.equal(schemas.deckSchema.safeParse(normalized).success, true)
})

for (const missing of ['themeSuggestion', 'body', 'suggestedIcon']) {
    test(`provider contract rejects missing ${missing} while accepting explicit null`, () => {
        const deck = syntheticDeck()
        if (missing === 'themeSuggestion') delete deck.themeSuggestion
        else delete deck.slides[1][missing]
        assert.equal(schemas.providerDeckSchema.safeParse(deck).success, false)
        assert.equal(schemas.providerDeckSchema.safeParse(syntheticDeck()).success, true)
    })
}

for (const count of [3, 4, 15, 16]) {
    test(`provider/public/input slide bounds for ${count} slides remain unchanged`, () => {
        const valid = count >= 4 && count <= 15
        assert.equal(schemas.providerDeckSchema.safeParse(syntheticDeck(count)).success, valid)
        assert.equal(schemas.deckSchema.safeParse(schemas.normalizeProviderDeck(syntheticDeck(count))).success, valid)
        assert.equal(schemas.bodySchema.safeParse({ content: 'Synthetic topic', targetSlides: count }).success, valid)
    })
}

test('generate prompt asks for null fields, without changing the edit prompt contract', () => {
    assert.match(prompts.CAROUSEL_GENERATE_SYSTEM, /Include body and suggestedIcon on every slide/)
    assert.match(prompts.CAROUSEL_GENERATE_SYSTEM, /use null otherwise/)
    assert.match(prompts.CAROUSEL_GENERATE_SYSTEM, /Include themeSuggestion, using null/)
    assert.match(prompts.CAROUSEL_EDIT_SYSTEM, /optionally/)
})

async function executeRoute({
    fixture = syntheticDeck(),
    failure,
    user = true,
    allowed = true,
    body = { content: 'Synthetic topic' },
} = {}) {
    const counters = { auth: 0, preflightUsage: 0, providerSeams: 0, successWrites: 0 }
    const client = {
        auth: {
            getUser: async () => {
                counters.auth += 1
                return { data: { user: user ? { id: 'synthetic-offline-user' } : null } }
            },
        },
        from: (table) => {
            if (table !== 'billing') counters.successWrites += 1
            assert.equal(table, 'billing', 'only existing preflight plan SELECT is permitted')
            const forbidWrite = () => {
                counters.successWrites += 1
                assert.fail('No draft, success or billing write is permitted')
            }
            return {
                select: () => ({ maybeSingle: async () => ({ data: { plan: 'free' }, error: null }) }),
                insert: forbidWrite,
                update: forbidWrite,
                upsert: forbidWrite,
                delete: forbidWrite,
            }
        },
        rpc: async (name, args) => {
            counters.preflightUsage += 1
            assert.equal(name, 'check_and_record_usage')
            assert.equal(args.p_action, 'carouselGenerate')
            assert.equal(args.p_limit, 3)
            return { data: { allowed, remaining: allowed ? 2 : 0, reset_at: '2099-01-01T00:00:00Z' }, error: null }
        },
    }
    const route = loadActualModule('app/api/carousel/generate/route.ts', {
        '@/env.mjs': { env: { LLM_API_KEY: 'offline-unused', LLM_MODEL: 'synthetic-model' } },
        '@/lib/supabase/server': { createClient: async () => client },
        '@/lib/rate-limit': { checkRateLimit },
        './route.schema': schemas,
        '@/config/carousel-prompts': prompts,
        '@ai-sdk/openai': {
            createOpenAI: () => (model) => {
                assert.equal(model, 'synthetic-model')
                return {}
            },
        },
        'ai': {
            generateObject: async (options) => {
                counters.providerSeams += 1
                assert.equal(options.schema, schemas.providerDeckSchema)
                assert.equal(options.system, prompts.CAROUSEL_GENERATE_SYSTEM)
                if (failure) throw failure
                return { object: options.schema.parse(fixture) }
            },
        },
    })
    const request = new Request('https://synthetic.invalid/api/carousel/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
    })
    const response = await route.POST(request)
    return { response, payload: await response.json(), counters }
}

test('actual POST returns normalized omitted optional fields for explicitly synthetic offline output', async () => {
    const { response, payload, counters } = await executeRoute()
    assert.equal(response.status, 200)
    assert.deepEqual(payload, schemas.normalizeProviderDeck(syntheticDeck()))
    assertNoNulls(payload)
    assert.deepEqual(counters, { auth: 1, preflightUsage: 1, providerSeams: 1, successWrites: 0 })
})

test('actual POST preserves present-value output for explicitly synthetic offline output', async () => {
    const { response, payload } = await executeRoute({ fixture: syntheticDeck(4, true) })
    assert.equal(response.status, 200)
    assert.deepEqual(payload, syntheticDeck(4, true))
})

for (const failure of [new Error('Synthetic provider rejection'), 'Synthetic non-Error rejection']) {
    test(`actual POST retains generation failure and no post-failure usage/success write: ${String(failure)}`, async () => {
        const { response, payload, counters } = await executeRoute({ failure })
        assert.equal(response.status, 500)
        assert.deepEqual(payload, { error: 'Failed to generate carousel', code: 'GENERATION_FAILED' })
        // Existing pre-generation usage accounting counts an attempt, even on failure. No new success write is added.
        assert.deepEqual(counters, { auth: 1, preflightUsage: 1, providerSeams: 1, successWrites: 0 })
    })
}

test('malformed synthetic provider output is a generation failure, not a successful deck', async () => {
    const { response, payload, counters } = await executeRoute({ fixture: syntheticDeck(3) })
    assert.equal(response.status, 500)
    assert.equal(payload.code, 'GENERATION_FAILED')
    assert.equal(Object.hasOwn(payload, 'slides'), false)
    assert.deepEqual(counters, { auth: 1, preflightUsage: 1, providerSeams: 1, successWrites: 0 })
})

for (const config of [
    { body: '{', status: 400 },
    { body: { content: '' }, status: 400 },
    { user: false, status: 401 },
    { allowed: false, status: 429 },
]) {
    test(`actual POST preserves ${config.status} precondition without generation`, async () => {
        const { response, counters } = await executeRoute(config)
        assert.equal(response.status, config.status)
        assert.equal(counters.providerSeams, 0)
        assert.equal(counters.preflightUsage, config.status === 429 ? 1 : 0)
    })
}
