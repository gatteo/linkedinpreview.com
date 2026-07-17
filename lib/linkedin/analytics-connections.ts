import type { SupabaseClient } from '@supabase/supabase-js'

import { isExpired } from './connections'
import { encryptToken } from './crypto'

// ---------------------------------------------------------------------------
// linkedin_analytics_connections access. One row per user holds the encrypted
// App B (Community Management API) access token used for member post analytics.
// Separate from the publishing connection (./connections) because LinkedIn
// requires the Community Management API to be the only product on its app.
// ---------------------------------------------------------------------------

export interface AnalyticsConnectionRow {
    user_id: string
    access_token: string | null
    scope: string | null
    expires_at: string
    created_at: string
    updated_at: string
}

/** Connection metadata safe to expose to the client (no token). */
export interface AnalyticsConnectionStatus {
    connected: true
    expiresAt: string
    expired: boolean
}

/** Fetch the raw analytics connection row (includes encrypted token) for a user. */
export async function getAnalyticsConnectionRow(
    client: SupabaseClient,
    userId: string,
): Promise<AnalyticsConnectionRow | null> {
    const { data, error } = await client
        .from('linkedin_analytics_connections')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
    if (error) throw error
    return (data as AnalyticsConnectionRow) ?? null
}

/** Connection status (no token); null when not connected or token cleared. */
export async function getAnalyticsConnectionStatus(
    client: SupabaseClient,
    userId: string,
): Promise<AnalyticsConnectionStatus | null> {
    const row = await getAnalyticsConnectionRow(client, userId)
    if (!row || !row.access_token) return null
    return { connected: true, expiresAt: row.expires_at, expired: isExpired(row.expires_at) }
}

/** True when the user has a usable (present, non-expired) analytics token. */
export async function hasValidAnalyticsConnection(client: SupabaseClient, userId: string): Promise<boolean> {
    const row = await getAnalyticsConnectionRow(client, userId).catch(() => null)
    return Boolean(row?.access_token && !isExpired(row.expires_at))
}

/** Create or replace a user's analytics connection. Encrypts the token at rest. */
export async function upsertAnalyticsConnection(
    client: SupabaseClient,
    userId: string,
    input: { accessToken: string; scope: string | null; expiresInSeconds: number },
): Promise<void> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + input.expiresInSeconds * 1000).toISOString()

    const { error } = await client.from('linkedin_analytics_connections').upsert(
        {
            user_id: userId,
            access_token: encryptToken(input.accessToken),
            scope: input.scope,
            expires_at: expiresAt,
            updated_at: now.toISOString(),
        },
        { onConflict: 'user_id' },
    )
    if (error) throw error
}

/** Clear the stored analytics token (disconnect). */
export async function disconnectAnalyticsConnection(client: SupabaseClient, userId: string): Promise<void> {
    const { error } = await client
        .from('linkedin_analytics_connections')
        .update({ access_token: null, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    if (error) throw error
}
