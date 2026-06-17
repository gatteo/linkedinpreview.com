import type { NextRequest } from 'next/server'

import { env } from '@/env.mjs'
import { isLinkedInConfigured, LINKEDIN_CRON_BATCH, LINKEDIN_MAX_PUBLISH_ATTEMPTS } from '@/config/linkedin'
import { isExpired } from '@/lib/linkedin/connections'
import { decryptToken } from '@/lib/linkedin/crypto'
import { personUrn } from '@/lib/linkedin/oauth'
import { LinkedInApiError, publishMemberPost } from '@/lib/linkedin/posts'
import { tiptapToLinkedInText } from '@/lib/linkedin/serialize'
import { createAdminClient } from '@/lib/supabase/admin'
import { markDraftPublished, markDraftPublishFailed } from '@/lib/supabase/drafts'

export const maxDuration = 60

interface ClaimedPost {
    id: string
    user_id: string
    content: any
    media: { type: 'image' | 'video'; src: string } | null
    publish_attempts: number
}

interface ConnectionRow {
    linkedin_sub: string
    access_token: string | null
    expires_at: string
}

/**
 * Cron publisher. Runs on a schedule (Vercel Cron), claims due scheduled posts
 * atomically, and publishes each to LinkedIn. Reconciliation-based and idempotent:
 * it processes every post that is due, tolerating missed or duplicate invocations.
 */
export async function GET(request: NextRequest) {
    // Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`.
    const authHeader = request.headers.get('authorization')
    if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    if (!isLinkedInConfigured()) {
        return Response.json({ ok: true, skipped: 'not_configured' })
    }

    const admin = createAdminClient()

    const { data: claimed, error: claimError } = await admin.rpc('claim_due_linkedin_posts', {
        p_limit: LINKEDIN_CRON_BATCH,
    })
    if (claimError) {
        console.error('[cron/publish] claim failed', claimError.message)
        return Response.json({ ok: false, error: 'claim_failed' }, { status: 500 })
    }

    const posts = (claimed ?? []) as ClaimedPost[]
    let published = 0
    let failed = 0

    for (const post of posts) {
        try {
            const { data: conn } = await admin
                .from('linkedin_connections')
                .select('linkedin_sub, access_token, expires_at')
                .eq('user_id', post.user_id)
                .maybeSingle()
            const connection = conn as ConnectionRow | null

            if (!connection || !connection.access_token) {
                await markDraftPublishFailed(admin, post.id, 'LinkedIn account not connected', { permanent: true })
                failed++
                continue
            }
            if (isExpired(connection.expires_at)) {
                await markDraftPublishFailed(admin, post.id, 'LinkedIn connection expired - reconnect to publish', {
                    permanent: true,
                })
                failed++
                continue
            }

            const commentary = tiptapToLinkedInText(post.content)
            if (!commentary.trim()) {
                await markDraftPublishFailed(admin, post.id, 'Post is empty', { permanent: true })
                failed++
                continue
            }

            const result = await publishMemberPost({
                accessToken: decryptToken(connection.access_token),
                authorUrn: personUrn(connection.linkedin_sub),
                commentary,
                media: post.media,
            })
            await markDraftPublished(admin, post.id, { urn: result.postUrn, url: result.postUrl })
            published++
        } catch (err) {
            // Permanent on auth failure; otherwise retry until the attempt cap.
            const permanent =
                (err instanceof LinkedInApiError && err.status === 401) ||
                post.publish_attempts >= LINKEDIN_MAX_PUBLISH_ATTEMPTS
            const message =
                err instanceof LinkedInApiError ? `LinkedIn error ${err.status}` : 'Failed to publish to LinkedIn'
            await markDraftPublishFailed(admin, post.id, message, { permanent })
            console.error('[cron/publish] post', post.id, err instanceof Error ? err.message : err)
            failed++
        }
    }

    return Response.json({ ok: true, processed: posts.length, published, failed })
}
