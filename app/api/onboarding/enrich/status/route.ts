import { after } from 'next/server'

import type { RichStatusResponse } from '@/types/onboarding'
import { AI_ERROR_CODES } from '@/config/ai'
import { OB_FUNNEL_VERSION } from '@/config/analytics'
import { captureServer } from '@/lib/analytics/server'
import {
    checkPostsScrape,
    checkRichScrape,
    computeObservedCadence,
    followersFromPostRecords,
    inferStyleHints,
} from '@/lib/linkedin/rich-scrape'
import { postsFromScrapingdogProfile } from '@/lib/linkedin/scrapingdog-posts'
import { fetchOnboardingSession, upsertOnboardingSession } from '@/lib/supabase/onboarding-session'
import { createClient } from '@/lib/supabase/server'

// The client's rich-scrape poll target. Reads only the caller's own session row
// (RLS); when the Bright Data snapshots are done it downloads, normalizes, and
// persists them, so after the first 'ready' response this is a DB-only echo.
// Two snapshots per session: the POSTS dataset (full text + engagement, the
// analysis corpus - what we settle on) and the people-profile dataset
// (identity extras, merged when it happens to be ready too).
export const maxDuration = 30

// Server backstop: a snapshot that never resolves stops being polled client-side
// after ~6 minutes; past this it is marked failed so reloads don't revive it.
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

    // Fires exactly once per scrape, on the poll that settles it - the tab may
    // close before then, so this must be a server event.
    const reportSettled = (
        settled: 'ready' | 'empty' | 'failed',
        corpus: 'posts-dataset' | 'profile-activity' | 'scrapingdog-activity' | null,
    ) => {
        // A resumed session can settle days after it triggered (the user left
        // and came back), which reported as scrape latency and corrupted the
        // p90 (one observed sample: 367,941,450 ms). Only report ms_since_trigger
        // when it's plausibly a live measurement - the same ~6 min ceiling the
        // client polls to and this route treats snapshots as stale past - else
        // null, flagged `resumed` so a resumed settle is still visible without
        // polluting the latency metric.
        const rawMsSinceTrigger = session.rich_triggered_at
            ? Date.now() - new Date(session.rich_triggered_at).getTime()
            : null
        const liveMeasurement = rawMsSinceTrigger !== null && rawMsSinceTrigger <= STALE_PENDING_MS
        return after(() =>
            captureServer(user.id, 'onb_scrape_settled', {
                funnel_version: OB_FUNNEL_VERSION,
                status: settled,
                corpus,
                authored_count: (posts ?? []).filter((p) => p.origin === 'post').length,
                ms_since_trigger: liveMeasurement ? rawMsSinceTrigger : null,
                ...(rawMsSinceTrigger !== null && !liveMeasurement ? { resumed: true } : {}),
            }),
        )
    }

    if (status === 'pending' && (session.rich_snapshot_id || session.posts_snapshot_id)) {
        const failed = { status: 'failed' } as const
        const [profileResult, postsResult] = await Promise.all([
            session.rich_snapshot_id ? checkRichScrape(session.rich_snapshot_id) : Promise.resolve(failed),
            session.posts_snapshot_id ? checkPostsScrape(session.posts_snapshot_id) : Promise.resolve(failed),
        ])
        const stale =
            !!session.rich_triggered_at && Date.now() - new Date(session.rich_triggered_at).getTime() > STALE_PENDING_MS

        // The member slug, for the gated-profile fallback that mines the already
        // fetched Scrapingdog profile record when the paid corpora come up empty.
        const slugMatch = /\/in\/([^/?#]+)/.exec(session.profile_url ?? '')
        const slug = slugMatch ? decodeURIComponent(slugMatch[1]) : ''

        // Gated logged-out view (Bright Data dead_page) or a genuinely empty
        // corpus: mine session.fast_raw for the member's own activities/articles.
        // Pure parsing, no network - safe within maxDuration. Returns whether it
        // settled the poll to 'ready' so the caller skips the empty persistence.
        const settleFromScrapingdog = async (): Promise<boolean> => {
            if (!session.fast_raw || !slug) return false
            const fallback = postsFromScrapingdogProfile(session.fast_raw, slug)
            if (fallback.posts.length === 0) return false
            posts = fallback.posts
            status = 'ready'
            profile = {
                name: session.fast_profile?.name || '',
                headline: session.fast_profile?.headline || '',
                about: session.fast_profile?.about || '',
                avatarUrl: session.fast_profile?.avatarUrl || '',
                followers: null,
                connections: null,
                observed: computeObservedCadence(posts),
                styleHints: inferStyleHints(posts),
            }
            await upsertOnboardingSession(supabase, user.id, {
                rich_status: 'ready',
                rich_profile: profile,
                rich_posts: fallback.posts,
                posts_raw: fallback.records,
                posts_source: 'scrapingdog',
            }).catch(() => {})
            reportSettled('ready', 'scrapingdog-activity')
            return true
        }

        if (postsResult.status === 'ready') {
            // The posts corpus is what the analysis needs - settle now, merge the
            // profile snapshot's identity when it's in, fall back to the fast
            // tier's fields when it isn't (identity mostly comes from there anyway).
            const profileReady = profileResult.status === 'ready' ? profileResult : null
            const authored = postsResult.posts
            // A gated profile (dead_page) or a bare-empty corpus: try the
            // Scrapingdog-activity fallback before conceding 'empty'.
            const settledByFallback = (authored.length === 0 || postsResult.gated) && (await settleFromScrapingdog())
            if (!settledByFallback) {
                const leftoverActivity = (profileReady?.posts ?? []).filter((p) => p.origin === 'activity')
                posts = [...authored, ...leftoverActivity]
                status = authored.length > 0 ? 'ready' : 'empty'
                profile = {
                    name: profileReady?.profile.name || session.fast_profile?.name || '',
                    headline: profileReady?.profile.headline || session.fast_profile?.headline || '',
                    about: profileReady?.profile.about || session.fast_profile?.about || '',
                    avatarUrl: profileReady?.profile.avatarUrl || session.fast_profile?.avatarUrl || '',
                    followers: profileReady?.profile.followers ?? followersFromPostRecords(postsResult.records),
                    connections: profileReady?.profile.connections ?? null,
                    observed: computeObservedCadence(posts),
                    styleHints: inferStyleHints(posts),
                }
                await upsertOnboardingSession(supabase, user.id, {
                    rich_status: status,
                    rich_profile: profile,
                    rich_posts: posts,
                    // The complete provider records, verbatim - the analysis archive.
                    posts_raw: postsResult.records,
                    posts_source: status === 'ready' ? 'brightdata' : 'none',
                    ...(profileReady ? { rich_raw: profileReady.record } : {}),
                }).catch(() => {})
                reportSettled(status, 'posts-dataset')
            }
        } else if (profileResult.status === 'ready' && (postsResult.status === 'failed' || stale)) {
            // No posts snapshot (failed, or stuck past the backstop): the profile
            // dataset's activity-derived corpus is the fallback (truncated
            // previews, but real authored writing).
            const result = profileResult
            const authored = result.posts.filter((p) => p.origin === 'post')
            const settledByFallback = authored.length === 0 && (await settleFromScrapingdog())
            if (!settledByFallback) {
                status = authored.length > 0 ? 'ready' : 'empty'
                profile = { ...result.profile, observed: result.observed, styleHints: inferStyleHints(result.posts) }
                posts = result.posts
                await upsertOnboardingSession(supabase, user.id, {
                    rich_status: status,
                    rich_profile: profile,
                    rich_posts: posts,
                    rich_raw: result.record,
                    posts_source: status === 'ready' ? 'brightdata' : 'none',
                }).catch(() => {})
                reportSettled(status, 'profile-activity')
            }
        } else if ((postsResult.status === 'failed' && profileResult.status === 'failed') || stale) {
            // Both paid corpora failed - the member's own writing may still be in
            // the already-fetched Scrapingdog record, so try that before conceding.
            const settledByFallback = await settleFromScrapingdog()
            if (!settledByFallback) {
                status = 'failed'
                await upsertOnboardingSession(supabase, user.id, { rich_status: 'failed' }).catch(() => {})
                reportSettled('failed', null)
            }
        }
        // Any other combination keeps waiting: posts pending is worth holding for
        // even when the profile snapshot already landed or failed.
    }

    // Best-effort identity backfill (GH #26 hardening): the fast tier can fail
    // entirely (no Scrapingdog/JSON-LD card) while the independent Bright Data
    // people-profile snapshot still lands - normally merged in when the posts
    // corpus settles above, but a posts-only settle (the identity snapshot
    // wasn't ready at that exact poll) never revisits it once `rich_status`
    // leaves 'pending'. Recheck it here whenever we still have no name and the
    // snapshot id is on file, so recap/reveal show a real identity instead of
    // none - this only reads a snapshot's status, it never retriggers a scrape.
    if (status !== 'pending' && !profile?.name && !profile?.headline && session.rich_snapshot_id) {
        const identityResult = await checkRichScrape(session.rich_snapshot_id).catch(
            () => ({ status: 'failed' }) as const,
        )
        if (identityResult.status === 'ready') {
            profile = {
                name: identityResult.profile.name || profile?.name || '',
                headline: identityResult.profile.headline || profile?.headline || '',
                about: identityResult.profile.about || profile?.about || '',
                avatarUrl: identityResult.profile.avatarUrl || profile?.avatarUrl || '',
                followers: profile?.followers ?? identityResult.profile.followers,
                connections: profile?.connections ?? identityResult.profile.connections,
                observed: profile?.observed ?? null,
                styleHints: profile?.styleHints ?? null,
            }
            await upsertOnboardingSession(supabase, user.id, { rich_profile: profile }).catch(() => {})
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
                      styleHints: profile.styleHints ?? null,
                  }
                : {}),
        },
        insightsReady: !!session.insights,
    }
    return Response.json(response)
}
