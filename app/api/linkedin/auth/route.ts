import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { isLinkedInConfigured } from '@/config/linkedin'
import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { buildAuthorizeUrl } from '@/lib/linkedin/oauth'
import { createClient } from '@/lib/supabase/server'

export const OAUTH_STATE_COOKIE = 'li_oauth_state'

/** Start the LinkedIn OAuth consent flow. */
export async function GET() {
    if (!isLinkedInConfigured()) {
        return NextResponse.redirect(`${site.url}${Routes.DashboardSettings}?linkedin=unavailable`)
    }

    // Require an existing (anonymous) session so the callback can attach the
    // connection to a known user.
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.redirect(`${site.url}${Routes.DashboardSettings}?linkedin=session`)
    }

    const state = randomBytes(16).toString('hex')
    const cookieStore = await cookies()
    cookieStore.set(OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 600,
    })

    return NextResponse.redirect(buildAuthorizeUrl(state))
}
