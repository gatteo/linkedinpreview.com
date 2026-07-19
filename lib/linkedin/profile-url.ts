// ---------------------------------------------------------------------------
// Pure LinkedIn profile-URL helpers (no env / no fetch) so they are safe to use
// in client components for validation. The server-side fetch+parse lives in
// public-profile.ts, which re-exports these.
// ---------------------------------------------------------------------------

/**
 * Normalize any reasonable profile reference to the canonical public URL, or
 * null when it isn't a `/in/` profile. Accepts full URLs, bare host paths, and
 * `@slug`. Rejects non-profile LinkedIn URLs (company/jobs/etc.).
 */
export function normalizeProfileUrl(input: string | undefined | null): string | null {
    const raw = (input ?? '').trim()
    if (!raw) return null

    let slug = ''
    if (/linkedin\.com\/in\//i.test(raw)) {
        slug = raw.replace(/^.*linkedin\.com\/in\//i, '').replace(/[/?#].*$/, '')
    } else if (!raw.includes('linkedin.com')) {
        // Bare slug or @slug (only when it isn't some other linkedin.com URL).
        const match = raw.match(/^@?\/?(?:in\/)?([A-Za-z0-9\-_%]{2,150})\/?$/i)
        if (match) slug = match[1]
    } else {
        return null
    }

    slug = slug.replace(/^@/, '').trim()
    if (!slug || !/^[A-Za-z0-9\-_%]{2,150}$/.test(slug)) return null
    return `https://www.linkedin.com/in/${slug}`
}

/** Whether a string looks like a usable LinkedIn profile URL. */
export function isLikelyProfileUrl(input: string | undefined | null): boolean {
    return normalizeProfileUrl(input) !== null
}
