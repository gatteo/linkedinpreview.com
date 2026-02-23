import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

import { env } from '@/env.mjs'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                } catch {
                    // The `setAll` method is called from a Server Component where
                    // cookies cannot be set. This can be safely ignored if you have
                    // middleware refreshing user sessions.
                }
            },
        },
    })
}
