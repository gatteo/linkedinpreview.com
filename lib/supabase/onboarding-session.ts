import type { SupabaseClient } from '@supabase/supabase-js'

import type {
    ObservedCadence,
    OnboardingInsights,
    RichPost,
    RichProfileSummary,
    RichScrapeStatus,
    StyleHints,
} from '@/types/onboarding'

// ---------------------------------------------------------------------------
// Onboarding session CRUD (public.onboarding_sessions, one row per user).
//
// The server routes own the fetch/enrichment columns; the client owns answers +
// resume_at (written fire-and-forget from the controller). RLS scopes every
// access to the caller's own row - no service-role anywhere in this feature.
// ---------------------------------------------------------------------------

export type FastSource = 'scrapingdog' | 'jsonld' | 'oauth' | 'none'

export type OnboardingSessionRow = {
    user_id: string
    profile_url: string | null
    fast_source: FastSource | null
    fast_profile: { name?: string; headline?: string; about?: string; avatarUrl?: string } | null
    /** Complete raw provider payloads, verbatim (migration 021) - the analysis archive. */
    fast_raw: Record<string, unknown> | null
    rich_raw: Record<string, unknown> | null
    rich_snapshot_id: string | null
    rich_status: RichScrapeStatus
    rich_triggered_at: string | null
    rich_profile: (RichProfileSummary & { observed: ObservedCadence | null; styleHints?: StyleHints | null }) | null
    rich_posts: RichPost[] | null
    enrichment: Record<string, unknown> | null
    insights: OnboardingInsights | null
    insights_kind: OnboardingInsights['kind'] | null
    answers: Record<string, unknown>
    resume_at: string | null
    started_at: string
    completed_at: string | null
    converted: boolean | null
    updated_at: string
}

export type OnboardingSessionPatch = Partial<Omit<OnboardingSessionRow, 'user_id' | 'started_at' | 'updated_at'>>

/** The caller's own session row, or null when none exists yet. */
export async function fetchOnboardingSession(client: SupabaseClient): Promise<OnboardingSessionRow | null> {
    const { data, error } = await client.from('onboarding_sessions').select('*').maybeSingle()
    if (error) throw error
    return (data as OnboardingSessionRow) ?? null
}

/** Create-or-merge the caller's session row. Only the provided columns change. */
export async function upsertOnboardingSession(
    client: SupabaseClient,
    userId: string,
    patch: OnboardingSessionPatch,
): Promise<void> {
    const { error } = await client
        .from('onboarding_sessions')
        .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) throw error
}
