import { AI_ERROR_CODES } from '@/config/ai'
import {
    isLinkedInAnalyticsEnabled,
    isLinkedInConfigured,
    LINKEDIN_ANALYTICS_SYNC_BATCH,
    LINKEDIN_ERROR_CODES,
} from '@/config/linkedin'
import { hasAnyMetric } from '@/lib/analytics/metrics'
import { fetchMemberPostAnalytics } from '@/lib/linkedin/analytics'
import { getConnectionRow, isExpired } from '@/lib/linkedin/connections'
import { decryptToken } from '@/lib/linkedin/crypto'
import { commentaryToTiptapDoc, fetchMemberPosts } from '@/lib/linkedin/import'
import { personUrn } from '@/lib/linkedin/oauth'
import { LinkedInApiError } from '@/lib/linkedin/posts'
import { checkRateLimit } from '@/lib/rate-limit'
import { createImportedPublishedPost, findDraftIdByLinkedInUrn } from '@/lib/supabase/drafts'
import { upsertPostMetrics } from '@/lib/supabase/post-metrics'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

/** Whether API import is available to this member right now. */
export async function GET() {
    const configured = isLinkedInConfigured()
    const enabled = isLinkedInAnalyticsEnabled()

    if (!configured || !enabled) {
        return Response.json({ available: false, configured, enabled, connected: false })
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ available: false, configured, enabled, connected: false })

    const row = await getConnectionRow(supabase, user.id).catch(() => null)
    const connected = Boolean(row?.access_token && !isExpired(row.expires_at))
    return Response.json({ available: connected, configured, enabled, connected })
}

/** Import the member's existing LinkedIn posts (+ recent metrics) into analytics. */
export async function POST() {
    if (!isLinkedInConfigured() || !isLinkedInAnalyticsEnabled()) {
        return Response.json(
            { error: 'LinkedIn analytics import is not enabled', code: LINKEDIN_ERROR_CODES.NOT_CONFIGURED },
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

    const conn = await getConnectionRow(supabase, user.id).catch(() => null)
    if (!conn || !conn.access_token) {
        return Response.json(
            { error: 'Connect your LinkedIn account first', code: LINKEDIN_ERROR_CODES.NOT_CONNECTED },
            { status: 400 },
        )
    }
    if (isExpired(conn.expires_at)) {
        return Response.json(
            { error: 'LinkedIn connection expired - reconnect to import', code: LINKEDIN_ERROR_CODES.TOKEN_EXPIRED },
            { status: 400 },
        )
    }

    const rateLimit = await checkRateLimit(supabase, 'import')
    if (!rateLimit.allowed) {
        return Response.json(
            { error: 'Daily import limit reached', code: AI_ERROR_CODES.RATE_LIMITED, resetAt: rateLimit.resetAt },
            { status: 429 },
        )
    }

    const token = decryptToken(conn.access_token)
    const authorUrn = personUrn(conn.linkedin_sub)

    // Phase 1: fetch the member's posts and create a published-post record for any
    // not already in the app (dedup by URN). Records persist immediately, so a
    // later timeout in the metrics phase still leaves the history imported.
    let posts
    try {
        posts = await fetchMemberPosts(token, authorUrn)
    } catch (err) {
        const status = err instanceof LinkedInApiError ? err.status : undefined
        console.error('[analytics/import] fetch posts failed', status ?? err)
        return Response.json(
            { error: 'Failed to fetch your LinkedIn posts', code: LINKEDIN_ERROR_CODES.PUBLISH_FAILED },
            { status: 502 },
        )
    }

    let imported = 0
    let existing = 0
    const draftIdByUrn = new Map<string, string>()

    for (const post of posts) {
        try {
            let draftId = await findDraftIdByLinkedInUrn(supabase, user.id, post.urn)
            if (draftId) {
                existing++
            } else {
                draftId = await createImportedPublishedPost(supabase, user.id, {
                    content: commentaryToTiptapDoc(post.commentary),
                    urn: post.urn,
                    url: post.url,
                    publishedAtMs: post.createdAtMs,
                })
                imported++
            }
            draftIdByUrn.set(post.urn, draftId)
        } catch (err) {
            console.error('[analytics/import] create record failed', post.urn, err instanceof Error ? err.message : err)
        }
    }

    // Phase 2: best-effort metrics for the most recent posts (newest first). The
    // rest backfill over subsequent daily sync-analytics cron runs.
    let metricsSynced = 0
    const recent = posts.slice(0, LINKEDIN_ANALYTICS_SYNC_BATCH)
    for (const post of recent) {
        const draftId = draftIdByUrn.get(post.urn)
        if (!draftId) continue
        try {
            const values = await fetchMemberPostAnalytics(token, post.urn)
            if (hasAnyMetric(values)) {
                await upsertPostMetrics(supabase, user.id, draftId, values, 'linkedin_api')
                metricsSynced++
            }
        } catch (err) {
            console.error(
                '[analytics/import] metrics failed',
                post.urn,
                err instanceof LinkedInApiError ? err.status : err,
            )
        }
    }

    return Response.json({ success: true, total: posts.length, imported, existing, metricsSynced })
}
