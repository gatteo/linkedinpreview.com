import { AI_ERROR_CODES } from '@/config/ai'

interface RateLimitError {
    code: typeof AI_ERROR_CODES.RATE_LIMITED
    action: string
    resetAt: string
}

interface AuthError {
    code: typeof AI_ERROR_CODES.AUTH_REQUIRED
}

type AIError = RateLimitError | AuthError | null

export function parseAIError(error: Error): AIError {
    try {
        // useChat's onError wraps non-2xx response body text in the Error message
        const parsed = JSON.parse(error.message)
        if (parsed.code === AI_ERROR_CODES.RATE_LIMITED) {
            return parsed as RateLimitError
        }
        if (parsed.code === AI_ERROR_CODES.AUTH_REQUIRED) {
            return parsed as AuthError
        }
    } catch {
        // Not a JSON error — regular network/parse error
    }
    return null
}

export function isRateLimitError(error: AIError): error is RateLimitError {
    return error?.code === AI_ERROR_CODES.RATE_LIMITED
}

export function formatResetTime(resetAt: string): string {
    const reset = new Date(resetAt)
    const now = new Date()
    const diffMs = reset.getTime() - now.getTime()

    if (diffMs <= 0) return 'now'

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}
