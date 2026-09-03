import { createHash } from 'node:crypto'

import { env } from '@/env.mjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

import { bodySchema } from './route.schema'

const LEAD_CONSENT_VERSION = '2026-09-03'

function assertStrictSameOrigin(request: Request): Response | null {
    const host = request.headers.get('host')
    const origin = request.headers.get('origin')
    if (!host || !origin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const url = new URL(origin)
        if (url.protocol !== 'https:' || url.host !== host)
            return Response.json({ error: 'Forbidden' }, { status: 403 })
    } catch {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return null
}

function getTrustedIpHash(request: Request): string | null {
    const ip = request.headers.get('x-vercel-forwarded-for')?.trim()
    if (!ip || !env.SUPABASE_SERVICE_ROLE_KEY) return null
    return createHash('sha256').update(`${env.SUPABASE_SERVICE_ROLE_KEY}:${ip}`).digest('hex')
}

export async function POST(request: Request) {
    const originBlock = assertStrictSameOrigin(request)
    if (originBlock) return originBlock

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 })

    const ipHash = getTrustedIpHash(request)
    if (!ipHash) return Response.json({ error: 'Could not save lead' }, { status: 503 })

    try {
        const { data: result, error } = await createAdminClient().rpc('capture_consent_lead', {
            p_email_normalized: parsed.data.email.trim().toLowerCase(),
            p_user_id: user.id,
            p_ip_hash: ipHash,
            p_consented_at: new Date().toISOString(),
            p_consent_version: LEAD_CONSENT_VERSION,
            p_source: 'free_tool_post_copy',
        })
        if (error || !result) return Response.json({ error: 'Could not save lead' }, { status: 503 })
        if (result === 'rate_limited') return Response.json({ error: 'Please try again later.' }, { status: 429 })
        if (result === 'created') return Response.json({ captured: true })
        if (result === 'duplicate') return Response.json({ captured: false })
    } catch {
        return Response.json({ error: 'Could not save lead' }, { status: 503 })
    }

    return Response.json({ error: 'Could not save lead' }, { status: 503 })
}
