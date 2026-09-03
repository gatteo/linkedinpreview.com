import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

import { env } from '@/env.mjs'

/**
 * Service-role Supabase client. Bypasses RLS, so it is used only by trusted
 * server contexts: the cron publisher and authenticated server routes that perform
 * a narrowly scoped, server-validated cross-user write such as lead capture.
 *
 * Never import this from client code or a route reachable without authentication.
 */
export function createAdminClient(): SupabaseClient {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set - cron publisher cannot run')
    }
    return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
}
