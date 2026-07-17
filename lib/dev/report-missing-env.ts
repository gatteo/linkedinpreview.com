'use client'

import { toast } from 'sonner'

// Client-side counterpart to lib/dev/missing-env.ts. Turns the dev-only `missing`
// signal from a not-configured response into a toast that names the exact env vars
// a contributor must add to .env. No-ops in production, where `missing` is absent.

const isDev = process.env.NODE_ENV === 'development'

/**
 * Toast the env vars a contributor must set for `feature`. Reads the `missing`
 * array the server includes in dev-only not-configured responses. Returns whether
 * a toast fired, so callers can skip their generic error toast.
 */
export function reportMissingEnv(feature: string, missing: unknown): boolean {
    if (!isDev || !Array.isArray(missing) || missing.length === 0) return false
    toast.error(`${feature} is disabled - set ${missing.join(', ')} in .env`)
    return true
}

/** Read a `missingEnv` query param (set by dev OAuth redirects) and toast it. */
export function reportMissingEnvFromQuery(feature: string, params: URLSearchParams): boolean {
    if (!isDev) return false
    const raw = params.get('missingEnv')
    const missing = raw ? raw.split(',').filter(Boolean) : []
    return reportMissingEnv(feature, missing)
}
