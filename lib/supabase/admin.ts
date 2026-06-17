import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

import { env } from '@/env.mjs'

/**
 * Service-role Supabase client. Bypasses RLS, so it is used ONLY by trusted
 * server contexts that have no user session - currently the cron publisher, which
 * must read due scheduled posts and tokens across all users.
 *
 * Never import this from client code or a route reachable without the CRON_SECRET.
 */
export function createAdminClient(): SupabaseClient {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set - cron publisher cannot run')
    }
    return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
}
