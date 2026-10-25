const MAX_TITLE_LENGTH = 60
const TRUNCATED_LENGTH = 57

function isHighSurrogate(code: number): boolean {
    return code >= 0xd800 && code <= 0xdbff
}

/**
 * Shortens a draft title without splitting a UTF-16 surrogate pair. A lone
 * surrogate serializes to JSON that Postgres rejects (22P02), so the whole
 * insert or update fails.
 */
export function truncateTitle(text: string): string {
    if (text.length <= MAX_TITLE_LENGTH) return text
    const cut = isHighSurrogate(text.charCodeAt(TRUNCATED_LENGTH - 1)) ? TRUNCATED_LENGTH - 1 : TRUNCATED_LENGTH
    return text.slice(0, cut) + '...'
}
