import type { SupabaseClient } from '@supabase/supabase-js'

import { DEFAULT_BRANDING, type BrandingData } from '@/lib/branding'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Merge stored JSONB data with defaults to handle missing fields from
 * schema evolution.
 */
function mergeWithDefaults(stored: Partial<BrandingData>): BrandingData {
    return {
        profile: { ...DEFAULT_BRANDING.profile, ...stored.profile },
        positioning: { ...DEFAULT_BRANDING.positioning, ...stored.positioning },
        role: stored.role ?? DEFAULT_BRANDING.role,
        expertise: { ...DEFAULT_BRANDING.expertise, ...stored.expertise },
        writingStyle: { ...DEFAULT_BRANDING.writingStyle, ...stored.writingStyle },
        footer: { ...DEFAULT_BRANDING.footer, ...stored.footer },
        knowledgeBase: { ...DEFAULT_BRANDING.knowledgeBase, ...stored.knowledgeBase },
        dosDonts: { ...DEFAULT_BRANDING.dosDonts, ...stored.dosDonts },
    }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Fetch branding for the current user. Returns DEFAULT_BRANDING if no row exists.
 */
export async function fetchBranding(client: SupabaseClient): Promise<BrandingData> {
    const { data, error } = await client.from('branding').select('data').single()

    if (error) {
        if (error.code === 'PGRST116') return DEFAULT_BRANDING // no row yet
        throw error
    }

    return mergeWithDefaults((data?.data ?? {}) as Partial<BrandingData>)
}

/**
 * Upsert branding data for the given user.
 */
export async function upsertBranding(client: SupabaseClient, userId: string, data: BrandingData): Promise<void> {
    const { error } = await client
        .from('branding')
        .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

    if (error) throw error
}
