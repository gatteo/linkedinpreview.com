import type { SupabaseClient } from '@supabase/supabase-js'

import type { MetricSource, MetricValues, PostMetrics } from '@/lib/analytics/metrics'

// ---------------------------------------------------------------------------
// post_metrics table access. One row per draft holds the latest known engagement
// snapshot for a published post. RLS scopes reads/writes to the owner; the
// analytics sync cron uses the service-role client (which bypasses RLS).
// ---------------------------------------------------------------------------

interface MetricsRow {
    draft_id: string
    user_id: string
    impressions: number | null
    reach: number | null
    reactions: number | null
    comments: number | null
    reshares: number | null
    saves: number | null
    sends: number | null
    link_clicks: number | null
    follows: number | null
    profile_views: number | null
    source: MetricSource
    measured_at: string
    updated_at: string
}

function rowToMetrics(row: MetricsRow): PostMetrics {
    return {
        draftId: row.draft_id,
        impressions: row.impressions,
        reach: row.reach,
        reactions: row.reactions,
        comments: row.comments,
        reshares: row.reshares,
        saves: row.saves,
        sends: row.sends,
        linkClicks: row.link_clicks,
        follows: row.follows,
        profileViews: row.profile_views,
        source: row.source,
        measuredAt: new Date(row.measured_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
    }
}

/** Fetch all of the current user's post metrics, keyed by draft id. */
export async function fetchPostMetrics(client: SupabaseClient): Promise<Record<string, PostMetrics>> {
    const { data, error } = await client.from('post_metrics').select('*')
    if (error) throw error

    const byDraft: Record<string, PostMetrics> = {}
    for (const row of (data as MetricsRow[]) ?? []) {
        byDraft[row.draft_id] = rowToMetrics(row)
    }
    return byDraft
}

/**
 * Create or replace the metrics for a draft. `measured_at` defaults to now so the
 * dashboard can show how fresh the numbers are.
 */
export async function upsertPostMetrics(
    client: SupabaseClient,
    userId: string,
    draftId: string,
    values: MetricValues,
    source: MetricSource,
    measuredAtMs: number = Date.now(),
): Promise<PostMetrics> {
    const now = new Date().toISOString()
    const { data, error } = await client
        .from('post_metrics')
        .upsert(
            {
                draft_id: draftId,
                user_id: userId,
                impressions: values.impressions,
                reach: values.reach,
                reactions: values.reactions,
                comments: values.comments,
                reshares: values.reshares,
                saves: values.saves,
                sends: values.sends,
                link_clicks: values.linkClicks,
                follows: values.follows,
                profile_views: values.profileViews,
                source,
                measured_at: new Date(measuredAtMs).toISOString(),
                updated_at: now,
            },
            { onConflict: 'draft_id' },
        )
        .select('*')
        .single()

    if (error) throw error
    return rowToMetrics(data as MetricsRow)
}

/** Remove the metrics for a draft. */
export async function deletePostMetrics(client: SupabaseClient, draftId: string): Promise<void> {
    const { error } = await client.from('post_metrics').delete().eq('draft_id', draftId)
    if (error) throw error
}
