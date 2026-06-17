import type { SupabaseClient } from '@supabase/supabase-js'

import { LINKEDIN_TOKEN_EXPIRY_WARNING_DAYS } from '@/config/linkedin'

import { encryptToken } from './crypto'

// ---------------------------------------------------------------------------
// linkedin_connections table access. One row per user holds the encrypted
// access token plus the cached LinkedIn identity (person URN, name, picture).
// ---------------------------------------------------------------------------

interface ConnectionRow {
    user_id: string
    linkedin_sub: string
    name: string | null
    picture_url: string | null
    scope: string | null
    access_token: string | null // AES-GCM ciphertext; null once disconnected
    expires_at: string
    created_at: string
    updated_at: string
}

/** Connection metadata safe to expose to the client (no token). */
export interface LinkedInConnectionStatus {
    connected: true
    linkedinSub: string
    name: string | null
    pictureUrl: string | null
    expiresAt: string
    expiresSoon: boolean
    expired: boolean
}

export function isExpired(expiresAt: string, now: Date = new Date()): boolean {
    return new Date(expiresAt).getTime() <= now.getTime()
}

export function expiresSoon(expiresAt: string, now: Date = new Date()): boolean {
    const ms = new Date(expiresAt).getTime() - now.getTime()
    return ms > 0 && ms <= LINKEDIN_TOKEN_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000
}

export function toStatus(row: ConnectionRow): LinkedInConnectionStatus {
    return {
        connected: true,
        linkedinSub: row.linkedin_sub,
        name: row.name,
        pictureUrl: row.picture_url,
        expiresAt: row.expires_at,
        expiresSoon: expiresSoon(row.expires_at),
        expired: isExpired(row.expires_at),
    }
}

/** Fetch the raw connection row (includes encrypted token) for a user. */
export async function getConnectionRow(client: SupabaseClient, userId: string): Promise<ConnectionRow | null> {
    const { data, error } = await client.from('linkedin_connections').select('*').eq('user_id', userId).maybeSingle()
    if (error) throw error
    return (data as ConnectionRow) ?? null
}

/**
 * Fetch the connection status (no token) for a user. A row whose token has been
 * cleared by Disconnect is reported as not-connected - the row is kept only to
 * preserve the linkedin_sub -> account mapping for login.
 */
export async function getConnectionStatus(
    client: SupabaseClient,
    userId: string,
): Promise<LinkedInConnectionStatus | null> {
    const row = await getConnectionRow(client, userId)
    return row && row.access_token ? toStatus(row) : null
}

/**
 * Resolve which account owns a LinkedIn identity. Uses the service-role admin
 * client because RLS hides other users' connection rows. Returns null when the
 * identity has never been linked here. Relies on the unique(linkedin_sub)
 * constraint (migration 011) so at most one row matches.
 */
export async function findUserIdByLinkedInSub(
    adminClient: SupabaseClient,
    linkedinSub: string,
): Promise<string | null> {
    const { data, error } = await adminClient
        .from('linkedin_connections')
        .select('user_id')
        .eq('linkedin_sub', linkedinSub)
        .maybeSingle()
    if (error) throw error
    return (data?.user_id as string | undefined) ?? null
}

/** Create or replace a user's LinkedIn connection. Encrypts the token at rest. */
export async function upsertConnection(
    client: SupabaseClient,
    userId: string,
    input: {
        linkedinSub: string
        name: string | null
        pictureUrl: string | null
        scope: string | null
        accessToken: string
        expiresInSeconds: number
    },
): Promise<void> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + input.expiresInSeconds * 1000).toISOString()

    const { error } = await client.from('linkedin_connections').upsert(
        {
            user_id: userId,
            linkedin_sub: input.linkedinSub,
            name: input.name,
            picture_url: input.pictureUrl,
            scope: input.scope,
            access_token: encryptToken(input.accessToken),
            expires_at: expiresAt,
            updated_at: now.toISOString(),
        },
        { onConflict: 'user_id' },
    )
    if (error) throw error
}

/**
 * Disconnect publishing while keeping the account and the linkedin_sub -> account
 * mapping intact (so the user can still log back in via LinkedIn). Clears the
 * stored token rather than deleting the row.
 */
export async function disconnectConnection(client: SupabaseClient, userId: string): Promise<void> {
    const { error } = await client
        .from('linkedin_connections')
        .update({ access_token: null, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    if (error) throw error
}
