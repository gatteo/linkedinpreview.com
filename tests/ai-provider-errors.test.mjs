import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { APICallError, RetryError } from 'ai'
import ts from 'typescript'

import { analysisSchema, bodySchema as analyzeBodySchema } from '../app/api/analyze/route.schema.ts'
import { bodySchema as generateBodySchema, schemaMap } from '../app/api/generate/route.schema.ts'
import { bodySchema as formatsBodySchema, formatsSchema } from '../app/api/strategy/formats/route.schema.ts'
import { bodySchema as positioningBodySchema, positioningSchema } from '../app/api/strategy/positioning/route.schema.ts'
import { assertSameOrigin } from '../lib/ai-guard.ts'
import { isAIProviderRateLimit } from '../lib/ai-provider-error.ts'

const AI_ERROR_CODES = {
    RATE_LIMITED: 'RATE_LIMITED',
    PROVIDER_RATE_LIMITED: 'PROVIDER_RATE_LIMITED',
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    INVALID_INPUT: 'INVALID_INPUT',
    GENERATION_FAILED: 'GENERATION_FAILED',
}

const silentConsole = { ...console, error() {} }

function apiError(statusCode) {
    return new APICallError({
        message: 'Synthetic provider failure',
        url: 'https://provider.invalid/v1/responses',
        requestBodyValues: {},
        statusCode,
        responseBody: '{}',
    })
}

function retryError(statusCode) {
    return new RetryError({
        message: 'Synthetic retries exhausted',
        reason: 'maxRetriesExceeded',
        errors: [apiError(statusCode)],
    })
}

async function loadRoute(route, routeMocks) {
    const routeUrl = new URL(`../${route}`, import.meta.url)
    const source = await readFile(routeUrl, 'utf8')
    const compiled = ts.transpileModule(source, {
        compilerOptions: {
            esModuleInterop: true,
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
        },
        fileName: fileURLToPath(routeUrl),
    }).outputText

    const loadedModule = { exports: {} }
    const mocks = {
        '@ai-sdk/openai': { createOpenAI: () => () => ({}) },
        'ai': { generateObject: async () => ({ object: {} }) },
        '@/env.mjs': { env: { LLM_API_KEY: 'synthetic-key', LLM_MODEL: 'synthetic-model' } },
        '@/config/ai': { AI_ERROR_CODES, DEFAULT_LLM_MODEL: 'synthetic-model' },
        '@/lib/ai-guard': { assertSameOrigin },
        '@/lib/ai-provider-error': { isAIProviderRateLimit },
        '@/lib/content-scoring': { countWords: () => 1 },
        '@/lib/rate-limit': { checkRateLimit: async () => ({ allowed: true, remaining: 1, resetAt: null }) },
        '@/lib/supabase/server': { createClient: async () => ({}) },
        ...routeMocks,
    }

    runInNewContext(compiled, {
        Request,
        Response,
        URL,
        console: silentConsole,
        exports: loadedModule.exports,
        module: loadedModule,
        process,
        require(specifier) {
            assert.ok(specifier in mocks, `Missing route test mock for ${specifier}`)
            return mocks[specifier]
        },
    })

    return { exports: loadedModule.exports, source }
}

function createRequest(path, body) {
    return new Request(`https://preview.invalid${path}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'host': 'preview.invalid',
            'origin': 'https://preview.invalid',
        },
        body: JSON.stringify(body),
    })
}

const routes = [
    {
        name: 'generate',
        path: '/api/generate',
        source: 'app/api/generate/route.ts',
        handler: 'handleGenerateRequest',
        body: { action: 'variation', sourceText: 'A valid synthetic post.' },
        mocks: {
            '@/config/prompts': {
                GENERATE_PROMPTS: { variation: { system: 'system', user: () => 'prompt' } },
                generateConstraints: () => '',
            },
            './route.schema': { bodySchema: generateBodySchema, schemaMap },
        },
    },
    {
        name: 'strategy/formats',
        path: '/api/strategy/formats',
        source: 'app/api/strategy/formats/route.ts',
        handler: 'handleFormatsRequest',
        body: { role: 'Founder', goals: ['Grow'], audience: ['SaaS founders'], topics: ['Writing'] },
        mocks: {
            '@/config/prompts': {
                STRATEGY_FORMATS_SYSTEM_PROMPT: 'system',
                strategyFormatsUserPrompt: () => 'prompt',
            },
            './route.schema': { bodySchema: formatsBodySchema, formatsSchema },
        },
    },
    {
        name: 'strategy/positioning',
        path: '/api/strategy/positioning',
        source: 'app/api/strategy/positioning/route.ts',
        handler: 'handlePositioningRequest',
        body: { role: 'Founder', goals: ['Grow'], audience: ['SaaS founders'], topics: ['Writing'] },
        mocks: {
            '@/config/prompts': {
                POSITIONING_SYSTEM_PROMPT: 'system',
                positioningUserPrompt: () => 'prompt',
            },
            './route.schema': { bodySchema: positioningBodySchema, positioningSchema },
        },
    },
    {
        name: 'analyze',
        path: '/api/analyze',
        source: 'app/api/analyze/route.ts',
        handler: 'handleAnalyzeRequest',
        body: {
            postText: 'A valid synthetic post.',
            hasImage: false,
            hasFormatting: false,
            contentLength: 23,
            lineCount: 1,
            hashtagCount: 0,
            emojiCount: 0,
        },
        mocks: {
            '@/config/prompts': { ANALYZE_SYSTEM_PROMPT: 'system', analyzeUserPrompt: () => 'prompt' },
            './route.schema': { analysisSchema, bodySchema: analyzeBodySchema },
        },
        sameOrigin: true,
    },
]

const failures = [
    { name: 'direct provider 429', error: () => apiError(429), status: 429, code: 'PROVIDER_RATE_LIMITED' },
    { name: 'retry-wrapped provider 429', error: () => retryError(429), status: 429, code: 'PROVIDER_RATE_LIMITED' },
    { name: 'direct provider 401', error: () => apiError(401), status: 500, code: 'GENERATION_FAILED' },
    { name: 'retry-wrapped provider 401', error: () => retryError(401), status: 500, code: 'GENERATION_FAILED' },
    {
        name: 'generic failure',
        error: () => new Error('Synthetic unknown failure'),
        status: 500,
        code: 'GENERATION_FAILED',
    },
]

test('detects direct and retried upstream 429 failures', () => {
    assert.equal(isAIProviderRateLimit(apiError(429)), true)
    assert.equal(isAIProviderRateLimit(retryError(429)), true)
})

test('does not reclassify provider auth or unknown failures', () => {
    assert.equal(isAIProviderRateLimit(apiError(401)), false)
    assert.equal(isAIProviderRateLimit(retryError(401)), false)
    assert.equal(isAIProviderRateLimit(new Error('Synthetic unknown failure')), false)
})

test('affected route handlers preserve auth and rate-limit preconditions while classifying provider failures', async (t) => {
    for (const route of routes) {
        const loaded = await loadRoute(route.source, route.mocks)
        const handler = loaded.exports[route.handler]
        assert.equal(typeof handler, 'function', `${route.name} exports ${route.handler}`)

        for (const failure of failures) {
            await t.test(`${route.name}: ${failure.name}`, async () => {
                let authChecks = 0
                let rateLimitChecks = 0
                let providerCalls = 0
                let databaseWrites = 0

                const supabase = {
                    auth: {
                        async getUser() {
                            authChecks += 1
                            return { data: { user: { id: 'synthetic-user' } } }
                        },
                    },
                    from() {
                        databaseWrites += 1
                        return { insert: async () => ({ error: null }) }
                    },
                }
                const dependencies = {
                    assertSameOrigin,
                    createClient: async () => supabase,
                    checkRateLimit: async () => {
                        rateLimitChecks += 1
                        return { allowed: true, remaining: 1, resetAt: null }
                    },
                    createOpenAI: () => () => ({}),
                    generateObject: async () => {
                        providerCalls += 1
                        throw failure.error()
                    },
                }

                const response = await handler(createRequest(route.path, route.body), dependencies)
                const payload = await response.json()

                assert.equal(response.status, failure.status)
                assert.equal(payload.code, failure.code)
                assert.equal(authChecks, 1, 'authenticated user precondition ran')
                assert.equal(rateLimitChecks, 1, 'allowed rate-limit precondition ran')
                assert.equal(providerCalls, 1, 'provider seam was executed')
                assert.equal(databaseWrites, 0, 'provider failure performed no database write')
            })
        }
    }
})

test('affected routes retain the executable handler seam and supplemental provider mapping', async () => {
    for (const route of routes) {
        const source = await readFile(new URL(`../${route.source}`, import.meta.url), 'utf8')
        assert.match(source, new RegExp(`export async function ${route.handler}`), route.source)
        assert.match(source, new RegExp(`return ${route.handler}\\(request\\)`), route.source)
        assert.match(source, /isAIProviderRateLimit\(err\)/, route.source)
        assert.match(source, /code: AI_ERROR_CODES\.PROVIDER_RATE_LIMITED/, route.source)
        assert.match(source, /\{ status: 429 \}/, route.source)
    }
})
