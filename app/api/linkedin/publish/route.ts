import { isLinkedInConfigured, LINKEDIN_ERROR_CODES, LINKEDIN_MAX_POST_CHARS } from '@/config/linkedin'
import { getConnectionRow, isExpired } from '@/lib/linkedin/connections'
import { decryptToken } from '@/lib/linkedin/crypto'
import { personUrn } from '@/lib/linkedin/oauth'
import { LinkedInApiError, publishMemberPost } from '@/lib/linkedin/posts'
import { tiptapToLinkedInText } from '@/lib/linkedin/serialize'
import { fetchDraft, markDraftPublished } from '@/lib/supabase/drafts'
import { createClient } from '@/lib/supabase/server'

import { bodySchema } from './route.schema'

export const maxDuration = 60

export async function POST(request: Request) {
    if (!isLinkedInConfigured()) {
        return Response.json(
            { error: 'LinkedIn publishing is not configured', code: LINKEDIN_ERROR_CODES.NOT_CONFIGURED },
            { status: 503 },
        )
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
        return Response.json(
            { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: LINKEDIN_ERROR_CODES.INVALID_INPUT },
            { status: 400 },
        )
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return Response.json(
            { error: 'Authentication required', code: LINKEDIN_ERROR_CODES.AUTH_REQUIRED },
            { status: 401 },
        )
    }

    // Resolve the connection / access token.
    const connection = await getConnectionRow(supabase, user.id)
    if (!connection || !connection.access_token) {
        return Response.json(
            { error: 'LinkedIn is not connected', code: LINKEDIN_ERROR_CODES.NOT_CONNECTED },
            { status: 400 },
        )
    }
    if (isExpired(connection.expires_at)) {
        return Response.json(
            { error: 'LinkedIn connection expired - reconnect to publish', code: LINKEDIN_ERROR_CODES.TOKEN_EXPIRED },
            { status: 400 },
        )
    }

    // Load the draft and serialize its content.
    const draft = await fetchDraft(supabase, parsed.data.draftId)
    if (!draft) {
        return Response.json({ error: 'Draft not found' }, { status: 404 })
    }

    const commentary = tiptapToLinkedInText(draft.content.content)
    if (!commentary.trim()) {
        return Response.json(
            { error: 'Cannot publish an empty post', code: LINKEDIN_ERROR_CODES.INVALID_INPUT },
            { status: 400 },
        )
    }
    if (commentary.length > LINKEDIN_MAX_POST_CHARS) {
        return Response.json(
            {
                error: `Post exceeds the ${LINKEDIN_MAX_POST_CHARS}-character LinkedIn limit`,
                code: LINKEDIN_ERROR_CODES.INVALID_INPUT,
            },
            { status: 400 },
        )
    }

    // Atomically claim the draft so the cron publisher (or a double click) cannot
    // also publish it. The claim sets publish_lock_at; markDraftPublished clears it,
    // and the catch below releases it so the user can retry after a failure.
    const { data: claimed, error: claimError } = await supabase.rpc('claim_draft_for_publish', {
        p_id: parsed.data.draftId,
    })
    if (claimError) {
        console.error('[linkedin/publish] claim error', claimError.message)
        return Response.json(
            { error: 'Failed to publish to LinkedIn', code: LINKEDIN_ERROR_CODES.PUBLISH_FAILED },
            { status: 502 },
        )
    }
    if (!claimed) {
        return Response.json(
            {
                error: 'This post is already publishing or has been published',
                code: LINKEDIN_ERROR_CODES.PUBLISH_FAILED,
            },
            { status: 409 },
        )
    }

    try {
        const result = await publishMemberPost({
            accessToken: decryptToken(connection.access_token),
            authorUrn: personUrn(connection.linkedin_sub),
            commentary,
            media: draft.content.media,
        })
        await markDraftPublished(supabase, parsed.data.draftId, { urn: result.postUrn, url: result.postUrl })
        return Response.json({ ok: true, url: result.postUrl, urn: result.postUrn })
    } catch (err) {
        // Release the claim so the post is retryable.
        await supabase.from('drafts').update({ publish_lock_at: null }).eq('id', parsed.data.draftId)
        if (err instanceof LinkedInApiError) {
            console.error('[linkedin/publish] api error', err.status, err.body)
            if (err.status === 401) {
                return Response.json(
                    {
                        error: 'LinkedIn connection expired - reconnect to publish',
                        code: LINKEDIN_ERROR_CODES.TOKEN_EXPIRED,
                    },
                    { status: 400 },
                )
            }
            if (err.status === 429) {
                return Response.json(
                    { error: 'LinkedIn rate limit reached - try again later', code: LINKEDIN_ERROR_CODES.RATE_LIMITED },
                    { status: 429 },
                )
            }
        } else {
            console.error('[linkedin/publish]', err instanceof Error ? err.message : err)
        }
        return Response.json(
            { error: 'Failed to publish to LinkedIn', code: LINKEDIN_ERROR_CODES.PUBLISH_FAILED },
            { status: 502 },
        )
    }
}
