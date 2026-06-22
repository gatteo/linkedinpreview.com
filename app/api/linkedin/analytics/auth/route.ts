import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { isLinkedInAnalyticsConfigured } from '@/config/linkedin'
import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { buildAnalyticsAuthorizeUrl } from '@/lib/linkedin/oauth'
import { createClient } from '@/lib/supabase/server'

export const ANALYTICS_OAUTH_STATE_COOKIE = 'li_analytics_oauth_state'

function analyticsRedirect(status: string) {
    return NextResponse.redirect(`${site.url}${Routes.DashboardAnalytics}?analytics=${status}`)
}

/** Start the App B (analytics) OAuth consent flow. */
export async function GET() {
    if (!isLinkedInAnalyticsConfigured()) return analyticsRedirect('unavailable')

    // Require an existing session so the callback attaches the token to a user.
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return analyticsRedirect('session')

    const state = randomBytes(16).toString('hex')
    const cookieStore = await cookies()
    cookieStore.set(ANALYTICS_OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 600,
    })

    return NextResponse.redirect(buildAnalyticsAuthorizeUrl(state))
}
