import type { SupabaseClient } from '@supabase/supabase-js'

import { fetchBranding, upsertBranding } from '@/lib/supabase/branding'

// ---------------------------------------------------------------------------
// On a successful LinkedIn connection we seed the user's identity from their
// LinkedIn profile:
//   1. link the LinkedIn email to the anonymous auth user - converting it into
//      a real, email-backed account (sends a confirmation email),
//   2. update the auth user's metadata (name / avatar), and
//   3. seed the branding profile shown in post previews.
//
// All steps are best-effort and must never block a successful connection - the
// caller wraps this so a failure here still reports the connection as made.
//
// Branding fields are only filled when empty so we never clobber a name or
// avatar the user has already customised (also matters on reconnect, which
// re-runs the callback).
// ---------------------------------------------------------------------------

export interface LinkedInIdentity {
    linkedinSub: string
    name: string | null
    pictureUrl: string | null
    email: string | null
}

export interface SyncOptions {
    /** The current auth email, if the user is already a permanent account. */
    currentEmail?: string | null
    /** Absolute URL the email-confirmation link should return to. */
    confirmRedirectTo?: string
}

/** Seed the auth account + branding from a freshly connected LinkedIn identity. */
export async function syncIdentityFromLinkedIn(
    client: SupabaseClient,
    userId: string,
    identity: LinkedInIdentity,
    options: SyncOptions = {},
): Promise<void> {
    await updateAnonymousProfile(client, identity)
    await seedBrandingProfile(client, userId, identity)
    // Email linking last: it is the most likely to fail (e.g. the address is
    // already used by another account) and we don't want that to skip the
    // profile/branding seeding above.
    await linkEmail(client, identity, options)
}

/**
 * Link the LinkedIn email to the anonymous user, converting it into a real
 * account. With email confirmations enabled in Supabase this sends a
 * confirmation link to the address; the account stays anonymous until the user
 * confirms, at which point `is_anonymous` flips to false.
 */
async function linkEmail(client: SupabaseClient, identity: LinkedInIdentity, options: SyncOptions): Promise<void> {
    if (!identity.email) return
    // Already a permanent account - nothing to convert.
    if (options.currentEmail) return

    const { error } = await client.auth.updateUser(
        { email: identity.email },
        options.confirmRedirectTo ? { emailRedirectTo: options.confirmRedirectTo } : undefined,
    )
    if (error) throw error
}

/**
 * Update the auth user's metadata with the LinkedIn identity, giving the
 * previously nameless user a display name and avatar.
 */
async function updateAnonymousProfile(client: SupabaseClient, identity: LinkedInIdentity): Promise<void> {
    const data: Record<string, string> = { linkedin_sub: identity.linkedinSub }
    if (identity.name) {
        data.full_name = identity.name
        data.name = identity.name
    }
    if (identity.pictureUrl) data.avatar_url = identity.pictureUrl

    const { error } = await client.auth.updateUser({ data })
    if (error) throw error
}

/** Fill empty branding profile fields (name, avatar) from LinkedIn. */
async function seedBrandingProfile(client: SupabaseClient, userId: string, identity: LinkedInIdentity): Promise<void> {
    const branding = await fetchBranding(client)
    const { profile } = branding

    const name = profile.name || (identity.name ?? '')
    const avatarUrl = profile.avatarUrl || (identity.pictureUrl ?? '')

    // Nothing new to write (already set, or LinkedIn gave us nothing).
    if (name === profile.name && avatarUrl === profile.avatarUrl) return

    await upsertBranding(client, userId, {
        ...branding,
        profile: { ...profile, name, avatarUrl },
    })
}
