import type { RichStatusResponse } from '@/types/onboarding'
import { AI_ERROR_CODES } from '@/config/ai'
import { checkRichScrape } from '@/lib/linkedin/rich-scrape'
import { fetchOnboardingSession, upsertOnboardingSession } from '@/lib/supabase/onboarding-session'
import { createClient } from '@/lib/supabase/server'

// The client's rich-scrape poll target. Reads only the caller's own session row
// (RLS); when the Bright Data snapshot is done it downloads, normalizes, and
// persists it, so after the first 'ready' response this is a DB-only echo.
export const maxDuration = 30

// Server backstop: a snapshot that never resolves stops being polled client-side
// after ~2.5 minutes; past this it is marked failed so reloads don't revive it.
const STALE_PENDING_MS = 6 * 60_000

export async function GET() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: AI_ERROR_CODES.AUTH_REQUIRED }, { status: 401 })
    }

    const session = await fetchOnboardingSession(supabase).catch(() => null)
    if (!session) {
        return Response.json({ rich: { status: 'idle' }, insightsReady: false } satisfies RichStatusResponse)
    }

    let { rich_status: status, rich_profile: profile, rich_posts: posts } = session

    if (status === 'pending' && session.rich_snapshot_id) {
        const result = await checkRichScrape(session.rich_snapshot_id)
        if (result.status === 'ready') {
            const authored = result.posts.filter((p) => p.origin === 'post')
            status = authored.length > 0 ? 'ready' : 'empty'
            profile = { ...result.profile, observed: result.observed }
            posts = result.posts
            await upsertOnboardingSession(supabase, user.id, {
                rich_status: status,
                rich_profile: profile,
                rich_posts: posts,
            }).catch(() => {})
        } else if (result.status === 'failed') {
            status = 'failed'
            await upsertOnboardingSession(supabase, user.id, { rich_status: 'failed' }).catch(() => {})
        } else if (
            session.rich_triggered_at &&
            Date.now() - new Date(session.rich_triggered_at).getTime() > STALE_PENDING_MS
        ) {
            status = 'failed'
            await upsertOnboardingSession(supabase, user.id, { rich_status: 'failed' }).catch(() => {})
        }
    }

    const authoredCount = (posts ?? []).filter((p) => p.origin === 'post').length
    const response: RichStatusResponse = {
        rich: {
            status,
            ...(profile
                ? {
                      profile: {
                          name: profile.name,
                          headline: profile.headline,
                          about: profile.about,
                          avatarUrl: profile.avatarUrl,
                          followers: profile.followers,
                          connections: profile.connections,
                      },
                      postsCount: authoredCount,
                      observed: profile.observed,
                  }
                : {}),
        },
        insightsReady: !!session.insights,
    }
    return Response.json(response)
}
