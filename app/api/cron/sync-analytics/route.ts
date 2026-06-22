import type { NextRequest } from 'next/server'

import { env } from '@/env.mjs'
import { isLinkedInAnalyticsConfigured, LINKEDIN_ANALYTICS_SYNC_BATCH } from '@/config/linkedin'
import { fetchMemberPostAnalytics } from '@/lib/linkedin/analytics'
import { isExpired } from '@/lib/linkedin/connections'
import { decryptToken } from '@/lib/linkedin/crypto'
import { LinkedInApiError } from '@/lib/linkedin/posts'
import { createAdminClient } from '@/lib/supabase/admin'
import { upsertPostMetrics } from '@/lib/supabase/post-metrics'

export const maxDuration = 60

interface PublishedRow {
    id: string
    user_id: string
    linkedin_post_urn: string
}

interface ConnectionRow {
    access_token: string | null
    expires_at: string
}

/**
 * Analytics sync cron. When the analytics app (App B) is configured, refreshes
 * engagement metrics for the most recently published posts from the
 * memberCreatorPostAnalytics API using each member's App B token. Idempotent: it
 * upserts one row per draft, so a missed or duplicated run only changes how fresh
 * the numbers are.
 *
 * Inert by default - returns `skipped` when App B is not configured, so the
 * dashboard simply relies on manual / CSV-imported metrics until an operator
 * sets up the Community Management API app.
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    if (!isLinkedInAnalyticsConfigured()) {
        return Response.json({ ok: true, skipped: 'analytics_not_configured' })
    }

    const admin = createAdminClient()

    // Refresh the most recent published posts first - their numbers move the most.
    const { data: rows, error } = await admin
        .from('drafts')
        .select('id, user_id, linkedin_post_urn')
        .eq('status', 'published')
        .not('linkedin_post_urn', 'is', null)
        .order('published_at', { ascending: false })
        .limit(LINKEDIN_ANALYTICS_SYNC_BATCH)

    if (error) {
        console.error('[cron/sync-analytics] query failed', error.message)
        return Response.json({ ok: false, error: 'query_failed' }, { status: 500 })
    }

    const posts = (rows ?? []) as PublishedRow[]

    // Cache one decrypted token per user across that user's posts.
    const tokenByUser = new Map<string, string | null>()
    let synced = 0
    let failed = 0

    for (const post of posts) {
        try {
            let token = tokenByUser.get(post.user_id)
            if (token === undefined) {
                token = await resolveToken(admin, post.user_id)
                tokenByUser.set(post.user_id, token)
            }
            if (!token) continue // not connected / expired - skip silently

            const values = await fetchMemberPostAnalytics(token, post.linkedin_post_urn)
            await upsertPostMetrics(admin, post.user_id, post.id, values, 'linkedin_api')
            synced++
        } catch (err) {
            failed++
            const detail = err instanceof LinkedInApiError ? `${err.status}` : err instanceof Error ? err.message : err
            console.error('[cron/sync-analytics] post', post.id, detail)
        }
    }

    return Response.json({ ok: true, processed: posts.length, synced, failed })
}

/** Decrypt a user's analytics (App B) token, or null when not connected / expired. */
async function resolveToken(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<string | null> {
    const { data } = await admin
        .from('linkedin_analytics_connections')
        .select('access_token, expires_at')
        .eq('user_id', userId)
        .maybeSingle()
    const conn = data as ConnectionRow | null
    if (!conn || !conn.access_token || isExpired(conn.expires_at)) return null
    return decryptToken(conn.access_token)
}
