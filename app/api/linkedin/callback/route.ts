import { cookies } from 'next/headers'
import { after, NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

import { OB_FUNNEL_VERSION } from '@/config/analytics'
import { isLinkedInConfigured } from '@/config/linkedin'
import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { captureServer } from '@/lib/analytics/server'
import {
    countDrafts,
    encodePendingSwitch,
    mintSession,
    SWITCH_COOKIE,
    SWITCH_COOKIE_MAX_AGE,
} from '@/lib/linkedin/account-link'
import { findUserIdByLinkedInSub, releaseConnection, upsertConnection } from '@/lib/linkedin/connections'
import { syncIdentityFromLinkedIn } from '@/lib/linkedin/identity-sync'
import { exchangeCodeForToken, fetchUserInfo, type LinkedInUserInfo } from '@/lib/linkedin/oauth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

import { OAUTH_ORIGIN_COOKIE, OAUTH_STATE_COOKIE, oauthReturnRedirect } from '../auth/route'

/**
 * Account-switch outcomes are the settings page's concern regardless of where
 * the round-trip started - OnboardingController explicitly bails on them.
 */
function settingsRedirect(status: string) {
    return NextResponse.redirect(`${site.url}${Routes.DashboardSettings}?linkedin=${status}`)
}

/** The token + identity fields shared by attach and refresh paths. */
function connectionInput(token: { access_token: string; scope?: string; expires_in: number }, info: LinkedInUserInfo) {
    const name = info.name ?? ([info.given_name, info.family_name].filter(Boolean).join(' ') || null)
    return {
        linkedinSub: info.sub,
        name,
        pictureUrl: info.picture ?? null,
        scope: token.scope ?? null,
        accessToken: token.access_token,
        expiresInSeconds: token.expires_in,
    }
}

/** Handle the OAuth redirect from LinkedIn: validate, exchange, then resolve account. */
export async function GET(request: NextRequest) {
    // Consume the origin marker up front: this round-trip is over either way,
    // and every exit below needs to know where to return the member.
    const cookieStore = await cookies()
    const fromOnboarding = cookieStore.get(OAUTH_ORIGIN_COOKIE)?.value === 'onboarding'
    cookieStore.delete(OAUTH_ORIGIN_COOKIE)

    // Resolved before the first exit so every onboarding outcome below - including
    // the ones that return early - can be attributed to a person. A member who
    // abandons on LinkedIn's consent screen never reaches this route at all; this
    // names the outcome for everyone who does come back (GH #62).
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const trackOutcome = (status: string) => {
        if (!fromOnboarding || !user) return
        after(() => captureServer(user.id, 'onb_oauth_callback', { funnel_version: OB_FUNNEL_VERSION, status }))
    }

    const redirect = (status: string) => {
        trackOutcome(status)
        return oauthReturnRedirect(status, fromOnboarding)
    }

    if (!isLinkedInConfigured()) return redirect('unavailable')

    const params = request.nextUrl.searchParams
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')

    // Member denied consent or LinkedIn returned an error.
    if (error) return redirect('denied')

    // CSRF: the returned state must match the cookie we set at initiation.
    const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value
    cookieStore.delete(OAUTH_STATE_COOKIE)
    if (!code || !state || !expectedState || state !== expectedState) {
        return redirect('error')
    }

    if (!user) return redirect('session')

    try {
        const token = await exchangeCodeForToken(code)
        const info = await fetchUserInfo(token.access_token)
        const input = connectionInput(token, info)

        // Resolve whether this LinkedIn identity already owns an account here.
        // Requires the service-role client; without it we degrade to attach-only.
        const admin = getAdminClient()
        const existingOwner = admin ? await findUserIdByLinkedInSub(admin, info.sub) : null

        if (existingOwner && existingOwner !== user.id && admin) {
            const switched = await handleSwitch({
                supabase,
                admin,
                cookieStore,
                user,
                existingOwner,
                input,
                onOutcome: trackOutcome,
            })
            // null means the existing owner was an unreachable stale identity and
            // has been released - fall through and attach to this session instead.
            if (switched) return switched
        }

        // First link (1a/1b) or reconnect of the same account (2): attach to the
        // current user, then seed email/profile/branding from the identity.
        await upsertConnection(supabase, user.id, input)
        try {
            await syncIdentityFromLinkedIn(
                supabase,
                user.id,
                {
                    linkedinSub: info.sub,
                    name: input.name,
                    pictureUrl: info.picture ?? null,
                    email: info.email ?? null,
                },
                { currentEmail: user.email ?? null, confirmRedirectTo: `${site.url}/auth/confirm` },
            )
        } catch (err) {
            console.error('[linkedin/callback] identity sync', err instanceof Error ? err.message : err)
        }

        return redirect('connected')
    } catch (err) {
        console.error('[linkedin/callback]', err instanceof Error ? err.message : err)
        return redirect('error')
    }
}

/** Build the admin client, or null when the service-role key is not configured. */
function getAdminClient(): SupabaseClient | null {
    try {
        return createAdminClient()
    } catch {
        return null
    }
}

/**
 * The connected LinkedIn identity belongs to a different account (E). Treat the
 * connection as a login into E.
 */
async function handleSwitch({
    supabase,
    admin,
    cookieStore,
    user,
    existingOwner,
    input,
    onOutcome,
}: {
    supabase: SupabaseClient
    admin: SupabaseClient
    cookieStore: Awaited<ReturnType<typeof cookies>>
    user: { id: string; is_anonymous?: boolean }
    existingOwner: string
    input: Parameters<typeof upsertConnection>[2]
    onOutcome: (status: string) => void
}): Promise<NextResponse | null> {
    // A switch ends the onboarding round-trip somewhere onboarding cannot follow,
    // so it still has to be named - otherwise it reads as unexplained OAuth loss.
    const exit = (status: string) => {
        onOutcome(status)
        return settingsRedirect(status)
    }

    // The current user is already a saved account with its own data - never
    // silently abandon it. Block and explain (decision: block on owner conflict).
    if (user.is_anonymous === false) {
        return exit('linked-elsewhere')
    }

    // Signing into E requires an email to mint a magic link against. An account
    // without one can never be entered by any route, so it is not an identity
    // worth protecting - it is a stale mapping that would otherwise block this
    // LinkedIn account from connecting anywhere, permanently, with no recovery.
    // Release it and let the caller attach the connection to the live session.
    const { data: target, error: targetErr } = await admin.auth.admin.getUserById(existingOwner)
    if (targetErr) throw targetErr
    if (!target.user?.email) {
        console.warn('[linkedin/callback] releasing unreachable identity', existingOwner)
        await releaseConnection(admin, existingOwner)
        return null
    }

    // Refresh E's publish token with the freshly obtained one (this login also
    // re-arms publishing for E), regardless of the merge choice below.
    await upsertConnection(admin, existingOwner, input)

    // If the throwaway session has drafts, ask whether to carry them over before
    // switching. Otherwise sign straight in.
    const draftCount = await countDrafts(supabase)
    if (draftCount > 0) {
        cookieStore.set(SWITCH_COOKIE, encodePendingSwitch(user.id, existingOwner), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: SWITCH_COOKIE_MAX_AGE,
        })
        return exit('merge-prompt')
    }

    try {
        await mintSession(supabase, admin, existingOwner)
    } catch (err) {
        // E has no usable email, or the sign-in token failed - cannot switch.
        console.error('[linkedin/callback] switch', err instanceof Error ? err.message : err)
        return exit('signin-failed')
    }
    return exit('welcome')
}
