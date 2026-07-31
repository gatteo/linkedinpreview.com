import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { ENTRY_PARAM, type EntrySource } from '@/config/entry-sources'
import { isLinkedInConfigured, missingLinkedInEnv, ONBOARDING_LINKEDIN_STATUSES } from '@/config/linkedin'
import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { devMissingEnvParam } from '@/lib/dev/missing-env'
import { buildAuthorizeUrl } from '@/lib/linkedin/oauth'
import { createClient } from '@/lib/supabase/server'

export const OAUTH_STATE_COOKIE = 'li_oauth_state'

/** Marks an OAuth round-trip that started inside the onboarding flow. */
export const OAUTH_ORIGIN_COOKIE = 'li_oauth_origin'

const OAUTH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
} as const

/**
 * Return the member to the page that actually consumes the callback result.
 *
 * Onboarding statuses go to /dashboard, where OnboardingController is the only
 * reader. They must not land on /dashboard/settings: LinkedInConnection strips
 * `?linkedin` in a mount effect, which beats the controller's async resume gate
 * and silently drops the result (the member then sees the connect step again
 * with no message and retries forever).
 */
export function oauthReturnRedirect(status: string, fromOnboarding: boolean, extra = '') {
    const path =
        fromOnboarding && ONBOARDING_LINKEDIN_STATUSES.includes(status) ? Routes.Dashboard : Routes.DashboardSettings
    // Tag the return so it stops counting as `direct` entry traffic. A resumed
    // onboarding session keeps the source it originally started with (the
    // controller prefers the saved value), so this only labels arrivals that
    // have no prior session - which is exactly what it should mean.
    return NextResponse.redirect(
        `${site.url}${path}?linkedin=${status}${extra}&${ENTRY_PARAM}=${'oauth_return' satisfies EntrySource}`,
    )
}

/** Start the LinkedIn OAuth consent flow. */
export async function GET(request: NextRequest) {
    const fromOnboarding = request.nextUrl.searchParams.get('from') === 'onboarding'

    if (!isLinkedInConfigured()) {
        return oauthReturnRedirect('unavailable', fromOnboarding, devMissingEnvParam(missingLinkedInEnv()))
    }

    // Require an existing (anonymous) session so the callback can attach the
    // connection to a known user.
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return oauthReturnRedirect('session', fromOnboarding)
    }

    const state = randomBytes(16).toString('hex')
    const cookieStore = await cookies()
    cookieStore.set(OAUTH_STATE_COOKIE, state, OAUTH_COOKIE_OPTIONS)

    // Clear on the settings path too: an abandoned onboarding attempt would
    // otherwise leave a stale marker that reroutes a later settings connect.
    if (fromOnboarding) {
        cookieStore.set(OAUTH_ORIGIN_COOKIE, 'onboarding', OAUTH_COOKIE_OPTIONS)
    } else {
        cookieStore.delete(OAUTH_ORIGIN_COOKIE)
    }

    return NextResponse.redirect(buildAuthorizeUrl(state))
}
