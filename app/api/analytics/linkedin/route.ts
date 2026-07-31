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

    try {
        const [lifetime, series, aggregateByType] = await Promise.all([
            fetchFollowerCount(token),
            fetchFollowerSeries(token, range),
            fetchMemberAggregate(token, ACCOUNT_AGGREGATE_METRICS, range),
        ])

        return Response.json({
            configured,
            connected: true,
            testMode,
            days,
            followers: { lifetime, series },
            aggregate: {
                impressions: aggregateByType.IMPRESSION ?? null,
                reach: aggregateByType.MEMBERS_REACHED ?? null,
                reactions: aggregateByType.REACTION ?? null,
                comments: aggregateByType.COMMENT ?? null,
                reshares: aggregateByType.RESHARE ?? null,
            },
        })
    } catch (err) {
        console.error('[analytics/linkedin] fetch failed', err instanceof Error ? err.message : err)
        return Response.json(
            { error: 'Failed to load LinkedIn account analytics', code: LINKEDIN_ERROR_CODES.PUBLISH_FAILED },
            { status: 502 },
        )
    }
}
