import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { APICallError, RetryError } from 'ai'

import { isAIProviderRateLimit } from '../lib/ai-provider-error.ts'

function apiError(statusCode) {
    return new APICallError({
        message: 'Synthetic provider failure',
        url: 'https://provider.invalid/v1/responses',
        requestBodyValues: {},
        statusCode,
        responseBody: '{}',
    })
}

test('detects direct and retried upstream 429 failures', () => {
    const limited = apiError(429)
    const retried = new RetryError({
        message: 'Synthetic retries exhausted',
        reason: 'maxRetriesExceeded',
        errors: [limited],
    })

    assert.equal(isAIProviderRateLimit(limited), true)
    assert.equal(isAIProviderRateLimit(retried), true)
})

test('does not reclassify provider auth or unknown failures', () => {
    assert.equal(isAIProviderRateLimit(apiError(401)), false)
    assert.equal(isAIProviderRateLimit(new Error('Synthetic unknown failure')), false)
})

test('affected routes map provider quota failures to an intentional 429', async () => {
    const routes = [
        'app/api/generate/route.ts',
        'app/api/strategy/formats/route.ts',
        'app/api/strategy/positioning/route.ts',
        'app/api/analyze/route.ts',
    ]

    for (const route of routes) {
        const source = await readFile(new URL(`../${route}`, import.meta.url), 'utf8')
        assert.match(source, /isAIProviderRateLimit\(err\)/, route)
        assert.match(source, /code: AI_ERROR_CODES\.PROVIDER_RATE_LIMITED/, route)
        assert.match(source, /\{ status: 429 \}/, route)
    }
})
