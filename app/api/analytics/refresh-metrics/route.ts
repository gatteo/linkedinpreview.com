import { AI_ERROR_CODES } from '@/config/ai'
import {
    isLinkedInAnalyticsConfigured,
    LINKEDIN_ANALYTICS_SYNC_BATCH,
    LINKEDIN_ERROR_CODES,
    missingLinkedInAnalyticsEnv,
} from '@/config/linkedin'
import { hasAnyMetric } from '@/lib/analytics/metrics'
import { devMissingEnv } from '@/lib/dev/missing-env'
import { fetchMemberPostAnalytics } from '@/lib/linkedin/analytics'
import { getAnalyticsConnectionRow, hasValidAnalyticsConnection } from '@/lib/linkedin/analytics-connections'
import { isExpired } from '@/lib/linkedin/connections'
import { decryptToken } from '@/lib/linkedin/crypto'
import { LinkedInApiError } from '@/lib/linkedin/posts'
import { checkRateLimit } from '@/lib/rate-limit'
import { upsertPostMetrics } from '@/lib/supabase/post-metrics'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

interface PublishedRow {
    id: string
    linkedin_post_urn: string
}

/**
 * On-demand refresh of the current member's own post metrics from the analytics
 * app (App B). This is the same memberCreatorPostAnalytics call the daily
 * `cron/sync-analytics` job makes for every member, scoped to one member so they
 * don't have to wait for the next cron run right after connecting.
 *
 * Formerly this route also backfilled the member's LinkedIn post *history* via
 * the Posts API author finder (GET /rest/posts?q=author). That path required
 * `r_member_social`, a closed LinkedIn permission with no application process -
 * it 403s unconditionally, so it was removed. History backfill is now the CSV/
 * XLSX export import (see components/dashboard/analytics/import-metrics-dialog.tsx).
 */
export async function GET() {
    const configured = isLinkedInAnalyticsConfigured()
    if (!configured) {
        return Response.json({ configured, connected: false })
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return Response.json({ configured, connected: false })
    }

    const connected = await hasValidAnalyticsConnection(supabase, user.id)
    return Response.json({ configured, connected })
}

/** Refresh metrics for the current member's own posts published through this app. */
export async function POST() {
    if (!isLinkedInAnalyticsConfigured()) {
        return Response.json(
            {
                error: 'LinkedIn analytics is not configured',
                code: LINKEDIN_ERROR_CODES.NOT_CONFIGURED,
                ...devMissingEnv(missingLinkedInAnalyticsEnv()),
            },
            { status: 400 },
        )
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return Response.json({ error: 'Authentication required', code: AI_ERROR_CODES.AUTH_REQUIRED }, { status: 401 })
    }

    const analyticsConn = await getAnalyticsConnectionRow(supabase, user.id).catch(() => null)
    if (!analyticsConn || !analyticsConn.access_token) {
        return Response.json(
            { error: 'Connect LinkedIn for analytics first', code: LINKEDIN_ERROR_CODES.NOT_CONNECTED },
            { status: 400 },
        )
    }
    if (isExpired(analyticsConn.expires_at)) {
        return Response.json(
            { error: 'Analytics connection expired - reconnect to refresh', code: LINKEDIN_ERROR_CODES.TOKEN_EXPIRED },
            { status: 400 },
        )
    }

    // Reuses the 'import' rate-limit bucket (see migration 016) - same intent
    // (bound LinkedIn API calls per member), now spent on refreshing rather than
    // the removed history import.
    const rateLimit = await checkRateLimit(supabase, 'import')
    if (!rateLimit.allowed) {
        return Response.json(
            { error: 'Daily refresh limit reached', code: AI_ERROR_CODES.RATE_LIMITED, resetAt: rateLimit.resetAt },
            { status: 429 },
        )
    }

    const token = decryptToken(analyticsConn.access_token)

    const { data: rows, error } = await supabase
        .from('drafts')
        .select('id, linkedin_post_urn')
        .eq('status', 'published')
        .not('linkedin_post_urn', 'is', null)
        .order('published_at', { ascending: false })
        .limit(LINKEDIN_ANALYTICS_SYNC_BATCH)

    if (error) {
        console.error('[analytics/refresh-metrics] query failed', error.message)
        return Response.json(
            { error: 'Failed to load your posts', code: LINKEDIN_ERROR_CODES.PUBLISH_FAILED },
            { status: 500 },
        )
    }

    const posts = (rows ?? []) as PublishedRow[]
    let synced = 0

    for (const post of posts) {
        try {
            const values = await fetchMemberPostAnalytics(token, post.linkedin_post_urn)
            if (hasAnyMetric(values)) {
                await upsertPostMetrics(supabase, user.id, post.id, values, 'linkedin_api')
                synced++
            }
        } catch (err) {
            console.error(
                '[analytics/refresh-metrics] post',
                post.id,
                err instanceof LinkedInApiError ? err.status : err,
            )
        }
    }

    return Response.json({ success: true, total: posts.length, synced })
}
