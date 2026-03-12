import type { UIMessage } from 'ai'

export function extractTextFromMessage(message: UIMessage): string {
    return message.parts
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map((part) => part.text)
        .join('')
}

export const RATE_LIMITED_PREFIX = '[RATE_LIMITED]'

export function isRateLimitedMessage(message: UIMessage): boolean {
    return message.role === 'assistant' && extractTextFromMessage(message).startsWith(RATE_LIMITED_PREFIX)
}

export function getRateLimitedReason(message: UIMessage): string {
    return extractTextFromMessage(message).slice(RATE_LIMITED_PREFIX.length).trim()
}

export const REFUSAL_PREFIX = '[REFUSED]'

export function isRefusalMessage(message: UIMessage): boolean {
    return message.role === 'assistant' && extractTextFromMessage(message).startsWith(REFUSAL_PREFIX)
}

export function getRefusalReason(message: UIMessage): string {
    return extractTextFromMessage(message).slice(REFUSAL_PREFIX.length).trim()
}
