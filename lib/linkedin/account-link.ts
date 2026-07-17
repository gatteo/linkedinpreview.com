import type { SupabaseClient } from '@supabase/supabase-js'

import { decryptToken, encryptToken } from './crypto'

// ---------------------------------------------------------------------------
// LinkedIn-as-login: resolving and switching accounts.
//
// When a user connects a LinkedIn identity that already owns an account here,
// we log them into that account instead of attaching the identity to their
// (throwaway) anonymous session. The switch target is always derived from the
// OAuth-verified linkedin_sub on the server - never from client input.
// ---------------------------------------------------------------------------

/** Name of the short-lived cookie that carries a pending account switch. */
export const SWITCH_COOKIE = 'li_switch'

/** TTL for a pending switch, in seconds. */
const SWITCH_TTL_SECONDS = 600

interface PendingSwitch {
    /** The current (anonymous) user whose drafts may be merged. */
    from: string
    /** The existing account to sign into. */
    to: string
    /** Absolute expiry, epoch ms. */
    exp: number
}

/**
 * Encrypt a pending-switch payload for storage in an httpOnly cookie. Reuses the
 * AES-256-GCM token crypto so the {from,to} pair is authenticated and opaque to
 * the client - the browser only ever echoes back a merge boolean.
 */
export function encodePendingSwitch(from: string, to: string, now: number = Date.now()): string {
    const payload: PendingSwitch = { from, to, exp: now + SWITCH_TTL_SECONDS * 1000 }
    return encryptToken(JSON.stringify(payload))
}

/** Decrypt and validate a pending-switch cookie. Returns null if invalid/expired. */
export function decodePendingSwitch(value: string, now: number = Date.now()): PendingSwitch | null {
    try {
        const payload = JSON.parse(decryptToken(value)) as PendingSwitch
        if (!payload.from || !payload.to || typeof payload.exp !== 'number') return null
        if (payload.exp < now) return null
        return payload
    } catch {
        return null
    }
}

export const SWITCH_COOKIE_MAX_AGE = SWITCH_TTL_SECONDS

/** Count the current user's drafts (RLS-scoped to the caller's session). */
export async function countDrafts(client: SupabaseClient): Promise<number> {
    const { count, error } = await client.from('drafts').select('id', { count: 'exact', head: true })
    if (error) throw error
    return count ?? 0
}

/** Reassign one user's drafts to another. Admin client (bypasses RLS). */
export async function mergeDraftsInto(
    adminClient: SupabaseClient,
    fromUserId: string,
    toUserId: string,
): Promise<void> {
    const { error } = await adminClient.from('drafts').update({ user_id: toUserId }).eq('user_id', fromUserId)
    if (error) throw error
}

/**
 * Sign the current browser into an existing account by minting a one-time
 * magic-link token (admin) and immediately verifying it on the cookie client,
 * which overwrites the session cookies with the target account's.
 *
 * Throws if the target account has no usable email (e.g. an anonymous account
 * whose email-link was never confirmed) - it cannot be signed into this way.
 */
export async function mintSession(
    cookieClient: SupabaseClient,
    adminClient: SupabaseClient,
    userId: string,
): Promise<void> {
    const { data: userData, error: getErr } = await adminClient.auth.admin.getUserById(userId)
    if (getErr) throw getErr
    const email = userData.user?.email
    if (!email) throw new Error('Target account has no email - cannot sign in')

    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
    })
    if (linkErr) throw linkErr

    const tokenHash = linkData.properties?.hashed_token
    if (!tokenHash) throw new Error('Failed to generate sign-in token')

    const { error: verifyErr } = await cookieClient.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash })
    if (verifyErr) throw verifyErr
}
