import { APICallError, RetryError } from 'ai'

/**
 * The AI SDK wraps retryable provider failures in RetryError. Detect an
 * upstream 429 without inspecting or exposing the provider response body.
 */
export function isAIProviderRateLimit(error: unknown): boolean {
    let candidate = error

    for (let depth = 0; depth < 5; depth += 1) {
        if (APICallError.isInstance(candidate)) return candidate.statusCode === 429
        if (!RetryError.isInstance(candidate)) return false
        candidate = candidate.lastError
    }

    return false
}
