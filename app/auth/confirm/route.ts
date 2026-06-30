import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Email-confirmation handler. The confirmation link sent when a LinkedIn email
// is linked to the (formerly anonymous) account returns here with a one-time
// token. Verifying it applies the email change and makes the account permanent.
//
// Requires the Supabase email template to point at this route, e.g.
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}
// ---------------------------------------------------------------------------

function settingsRedirect(status: string) {
    return NextResponse.redirect(`${site.url}${Routes.DashboardSettings}?email=${status}`)
}

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams
    const tokenHash = params.get('token_hash')
    const type = params.get('type') as EmailOtpType | null

    if (!tokenHash || !type) return settingsRedirect('error')

    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) {
        console.error('[auth/confirm]', error.message)
        return settingsRedirect('error')
    }

    return settingsRedirect('confirmed')
}
