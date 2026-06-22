import { AI_ERROR_CODES } from '@/config/ai'
import { isLinkedInAnalyticsConfigured, LINKEDIN_ANALYTICS_SYNC_BATCH, LINKEDIN_ERROR_CODES } from '@/config/linkedin'
import { hasAnyMetric } from '@/lib/analytics/metrics'
import { fetchMemberPostAnalytics } from '@/lib/linkedin/analytics'
import { getAnalyticsConnectionRow, hasValidAnalyticsConnection } from '@/lib/linkedin/analytics-connections'
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

/**
 * Whether API import is available to this member: the analytics app (App B) is
 * configured, the member has connected it (valid token), and we know their person
 * URN from the publishing connection (App A) to use as the post author.
 */
export async function GET() {
    const configured = isLinkedInAnalyticsConfigured()
    if (!configured) {
        return Response.json({ available: false, configured, connected: false, needsPublishConnection: false })
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return Response.json({ available: false, configured, connected: false, needsPublishConnection: false })
    }

    const connected = await hasValidAnalyticsConnection(supabase, user.id)
    const appA = await getConnectionRow(supabase, user.id).catch(() => null)
    const hasAuthor = Boolean(appA?.linkedin_sub)

    return Response.json({
        available: connected && hasAuthor,
        configured,
        connected,
        needsPublishConnection: connected && !hasAuthor,
    })
}

/** Import the member's existing LinkedIn posts (+ recent metrics) into analytics. */
export async function POST() {
    if (!isLinkedInAnalyticsConfigured()) {
        return Response.json(
            { error: 'LinkedIn analytics is not configured', code: LINKEDIN_ERROR_CODES.NOT_CONFIGURED },
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

    // App B token (analytics) for the API calls.
    const analyticsConn = await getAnalyticsConnectionRow(supabase, user.id).catch(() => null)
    if (!analyticsConn || !analyticsConn.access_token) {
        return Response.json(
            { error: 'Connect LinkedIn for analytics first', code: LINKEDIN_ERROR_CODES.NOT_CONNECTED },
            { status: 400 },
        )
    }
    if (isExpired(analyticsConn.expires_at)) {
        return Response.json(
            { error: 'Analytics connection expired - reconnect to import', code: LINKEDIN_ERROR_CODES.TOKEN_EXPIRED },
            { status: 400 },
        )
    }

    // App A connection supplies the member's person URN (the post author).
    const appA = await getConnectionRow(supabase, user.id).catch(() => null)
    if (!appA?.linkedin_sub) {
        return Response.json(
            {
                error: 'Connect your LinkedIn account (publishing) so we can identify your posts',
                code: LINKEDIN_ERROR_CODES.NOT_CONNECTED,
            },
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

    const token = decryptToken(analyticsConn.access_token)
    const authorUrn = personUrn(appA.linkedin_sub)

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
