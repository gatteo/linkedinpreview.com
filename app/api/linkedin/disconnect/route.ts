import { LINKEDIN_ERROR_CODES } from '@/config/linkedin'
import { disconnectConnection } from '@/lib/linkedin/connections'
import { createClient } from '@/lib/supabase/server'

/**
 * Disconnect publishing. Clears the stored token but keeps the row so the
 * linkedin_sub -> account mapping survives (the user can log back in via LinkedIn).
 */
export async function POST() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return Response.json(
            { error: 'Authentication required', code: LINKEDIN_ERROR_CODES.AUTH_REQUIRED },
            { status: 401 },
        )
    }

    try {
        await disconnectConnection(supabase, user.id)
        return Response.json({ ok: true })
    } catch (err) {
        console.error('[linkedin/disconnect]', err instanceof Error ? err.message : err)
        return Response.json({ error: 'Failed to disconnect' }, { status: 500 })
    }
}
