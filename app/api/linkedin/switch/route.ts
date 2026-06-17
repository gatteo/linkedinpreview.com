import { cookies } from 'next/headers'

import { LINKEDIN_ERROR_CODES } from '@/config/linkedin'
import { decodePendingSwitch, mergeDraftsInto, mintSession, SWITCH_COOKIE } from '@/lib/linkedin/account-link'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Completes a pending LinkedIn login when the anonymous session had drafts. The
// callback set an encrypted httpOnly cookie binding {from, to}; the client only
// echoes back whether to merge. Identity is never taken from the request body.
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
    const cookieStore = await cookies()
    const raw = cookieStore.get(SWITCH_COOKIE)?.value
    const pending = raw ? decodePendingSwitch(raw) : null
    if (!pending) {
        return Response.json({ error: 'No pending sign-in' }, { status: 400 })
    }

    let merge = false
    try {
        const body = (await request.json()) as { merge?: unknown }
        merge = Boolean(body?.merge)
    } catch {
        // No body - treat as "just sign in".
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    // The current session must still be the user the switch was minted for.
    if (!user || user.id !== pending.from) {
        cookieStore.delete(SWITCH_COOKIE)
        return Response.json({ error: 'Session mismatch' }, { status: 409 })
    }

    let admin
    try {
        admin = createAdminClient()
    } catch {
        return Response.json(
            { error: 'Sign-in is unavailable', code: LINKEDIN_ERROR_CODES.NOT_CONFIGURED },
            { status: 503 },
        )
    }

    try {
        // Switch first: if this fails (e.g. target has no email) the current
        // session and its drafts are left untouched.
        await mintSession(supabase, admin, pending.to)
        if (merge) await mergeDraftsInto(admin, pending.from, pending.to)
    } catch (err) {
        console.error('[linkedin/switch]', err instanceof Error ? err.message : err)
        return Response.json({ error: 'Failed to sign in' }, { status: 500 })
    } finally {
        cookieStore.delete(SWITCH_COOKIE)
    }

    return Response.json({ ok: true })
}
