import { SignJWT } from 'jose'

import { env } from '@/env.mjs'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Featurebase identity JWT
//
// GET -> { jwt } signed for the authenticated Supabase user, so messenger
// conversations and feedback join with PostHog + billing on the same user id.
// Payload per https://help.featurebase.app/articles/5257986-creating-and-signing-a-jwt:
// `name` is required plus at least one of `email` / `userId`. Anonymous users
// get a deterministic fallback name from their id.
// ---------------------------------------------------------------------------

export const maxDuration = 10

export async function GET() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
    }
    if (!env.FEATUREBASE_JWT_SECRET) {
        return Response.json({ error: 'Support identity is not configured', code: 'NOT_CONFIGURED' }, { status: 503 })
    }

    const { data: branding } = await supabase.from('branding').select('name:data->profile->>name').maybeSingle()
    const brandingName = typeof branding?.name === 'string' ? branding.name.trim() : ''
    const name = brandingName || user.email?.split('@')[0] || `User ${user.id.slice(0, 8)}`

    const payload: Record<string, string> = { userId: user.id, name }
    if (user.email) payload.email = user.email

    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(env.FEATUREBASE_JWT_SECRET))

    return Response.json({ jwt })
}
