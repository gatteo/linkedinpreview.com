// Dev-only helpers for telling open-source contributors which optional env vars a
// feature needs. In production these are inert - `missing` is never included in a
// response, so we never leak which keys are (un)set on the server.

const isDev = process.env.NODE_ENV === 'development'

/**
 * Fields to merge into a not-configured API response so the client can name the
 * missing vars in a dev toast. Empty object in production.
 */
export function devMissingEnv(missing: string[]): { missing?: string[] } {
    return isDev ? { missing } : {}
}

/**
 * Query fragment (e.g. `&missingEnv=A,B`) appended to a dev OAuth `?...=unavailable`
 * redirect so the landing page can toast the missing vars. Empty string in production.
 */
export function devMissingEnvParam(missing: string[]): string {
    return isDev && missing.length ? `&missingEnv=${missing.join(',')}` : ''
}
