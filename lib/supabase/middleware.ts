import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { env } from '@/env.mjs'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                supabaseResponse = NextResponse.next({ request })
                cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
            },
        },
    })

    // Refresh session if it exists — do not use supabase.auth.getSession()
    // as it does not trigger a token refresh.
    await supabase.auth.getUser()

    return supabaseResponse
}
