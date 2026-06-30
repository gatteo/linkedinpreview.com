import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { isLinkedInAnalyticsConfigured } from '@/config/linkedin'
import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { upsertAnalyticsConnection } from '@/lib/linkedin/analytics-connections'
import { exchangeAnalyticsCodeForToken } from '@/lib/linkedin/oauth'
import { createClient } from '@/lib/supabase/server'

import { ANALYTICS_OAUTH_STATE_COOKIE } from '../auth/route'

function analyticsRedirect(status: string) {
    return NextResponse.redirect(`${site.url}${Routes.DashboardAnalytics}?analytics=${status}`)
}

/** Handle the App B OAuth redirect: validate, exchange, store the analytics token. */
export async function GET(request: NextRequest) {
    if (!isLinkedInAnalyticsConfigured()) return analyticsRedirect('unavailable')

    const params = request.nextUrl.searchParams
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')

    if (error) return analyticsRedirect('denied')

    const cookieStore = await cookies()
    const expectedState = cookieStore.get(ANALYTICS_OAUTH_STATE_COOKIE)?.value
    cookieStore.delete(ANALYTICS_OAUTH_STATE_COOKIE)
    if (!code || !state || !expectedState || state !== expectedState) {
        return analyticsRedirect('error')
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return analyticsRedirect('session')

    try {
        const token = await exchangeAnalyticsCodeForToken(code)
        await upsertAnalyticsConnection(supabase, user.id, {
            accessToken: token.access_token,
            scope: token.scope ?? null,
            expiresInSeconds: token.expires_in,
        })
        return analyticsRedirect('connected')
    } catch (err) {
        console.error('[linkedin/analytics/callback]', err instanceof Error ? err.message : err)
        return analyticsRedirect('error')
    }
}
