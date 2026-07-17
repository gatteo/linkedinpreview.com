// Next.js server boot hook. Dev-only: audit optional env vars once so open-source
// contributors see which integrations are disabled before they click into them.
export async function register() {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_RUNTIME !== 'nodejs') return
    const { warnMissingOptionalEnv } = await import('@/lib/dev/env-audit')
    warnMissingOptionalEnv()
}
