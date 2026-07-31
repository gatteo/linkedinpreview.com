import type { NextRequest } from 'next/server'

import { isLinkedInAnalyticsConfigured, isLinkedInAnalyticsTestMode, LINKEDIN_ERROR_CODES } from '@/config/linkedin'
import { getAnalyticsConnectionRow } from '@/lib/linkedin/analytics-connections'
import { isExpired } from '@/lib/linkedin/connections'
import { decryptToken } from '@/lib/linkedin/crypto'
import {
    ACCOUNT_AGGREGATE_METRICS,
    fetchFollowerCount,
    fetchFollowerSeries,
    fetchMemberAggregate,
    type DateRange,
} from '@/lib/linkedin/member-analytics'
import { LinkedInApiError } from '@/lib/linkedin/posts'
import { createClient } from '@/lib/supabase/server'

const DAY_MS = 24 * 60 * 60 * 1000
const ALLOWED_WINDOWS = [30, 90] as const

/**
 * Account-wide LinkedIn analytics: follower growth + aggregate post metrics over
 * a requested window. Fetch-and-display only - LinkedIn's terms cap storage of
 * member social activity at 48h, so nothing here is written to Supabase; every
 * call goes straight to LinkedIn (or, in test mode, a deterministic mock).
 */
export async function GET(request: NextRequest) {
    const testMode = isLinkedInAnalyticsTestMode()
    const configured = isLinkedInAnalyticsConfigured() || testMode
    if (!configured) {
        return Response.json({ configured: false, connected: false, testMode })
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return Response.json({ configured, connected: false, testMode })
    }

    let token: string | null = null
    if (testMode) {
        token = 'test-mode'
    } else {
        const conn = await getAnalyticsConnectionRow(supabase, user.id).catch(() => null)
        const connected = Boolean(conn?.access_token && !isExpired(conn.expires_at))
        if (!connected || !conn?.access_token) {
            return Response.json({ configured, connected: false, testMode })
        }
        token = decryptToken(conn.access_token)
    }

    const daysParam = Number(request.nextUrl.searchParams.get('days'))
    const days = (ALLOWED_WINDOWS as readonly number[]).includes(daysParam) ? daysParam : 30
    const endMs = Date.now()
    const range: DateRange = { startMs: endMs - days * DAY_MS, endMs }

    // The three surfaces fail independently: a member who connected App B
    // before `r_member_profileAnalytics` was added to the scopes will 403 on
    // the follower calls while the aggregate calls still work. One scope gap
    // must not blank data the member is authorized for.
    const [lifetime, series, aggregateByType] = await Promise.all([
        settle('followerCount', fetchFollowerCount(token)),
        settle('followerSeries', fetchFollowerSeries(token, range)),
        fetchMemberAggregate(token, ACCOUNT_AGGREGATE_METRICS, range),
    ])

    const followersDenied =
        (lifetime.error instanceof LinkedInApiError && lifetime.error.status === 403) ||
        (series.error instanceof LinkedInApiError && series.error.status === 403)

    const aggregate = {
        impressions: aggregateByType.IMPRESSION ?? null,
        reach: aggregateByType.MEMBERS_REACHED ?? null,
        reactions: aggregateByType.REACTION ?? null,
        comments: aggregateByType.COMMENT ?? null,
        reshares: aggregateByType.RESHARE ?? null,
    }

    const followersFailed = lifetime.error !== undefined && series.error !== undefined
    const aggregateFailed = Object.values(aggregate).every((v) => v === null)
    if (followersFailed && aggregateFailed) {
        return Response.json(
            { error: 'Failed to load LinkedIn account analytics', code: LINKEDIN_ERROR_CODES.PUBLISH_FAILED },
            { status: 502 },
        )
    }

    return Response.json({
        configured,
        connected: true,
        testMode,
        days,
        followers: {
            lifetime: lifetime.value ?? null,
            series: series.value ?? [],
            // 'reconnect' = the token predates the profile-analytics scope;
            // retrying can never succeed until the member reconnects App B.
            unavailable: followersDenied ? 'reconnect' : followersFailed ? 'error' : undefined,
        },
        aggregate,
    })
}

/** Await a LinkedIn call, logging failures (status + error body) instead of throwing. */
async function settle<T>(label: string, promise: Promise<T>): Promise<{ value?: T; error?: unknown }> {
    try {
        return { value: await promise }
    } catch (err) {
        if (err instanceof LinkedInApiError) {
            console.error(`[analytics/linkedin] ${label} failed`, err.status, err.body?.slice(0, 500) ?? '')
        } else {
            console.error(`[analytics/linkedin] ${label} failed`, err instanceof Error ? err.message : err)
        }
        return { error: err }
    }
}
