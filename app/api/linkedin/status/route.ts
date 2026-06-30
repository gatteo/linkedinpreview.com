import { isLinkedInConfigured } from '@/config/linkedin'
import { getConnectionStatus } from '@/lib/linkedin/connections'
import { createClient } from '@/lib/supabase/server'

/** Report whether the integration is configured and the user's connection state. */
export async function GET() {
    if (!isLinkedInConfigured()) {
        return Response.json({ configured: false, connection: null })
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return Response.json({ configured: true, connection: null })
    }

    try {
        const connection = await getConnectionStatus(supabase, user.id)
        return Response.json({ configured: true, connection })
    } catch (err) {
        console.error('[linkedin/status]', err instanceof Error ? err.message : err)
        return Response.json({ configured: true, connection: null })
    }
}
