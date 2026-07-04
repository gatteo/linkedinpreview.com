'use client'

import * as React from 'react'

import { fetchInsights, fetchRichStatus, track } from './ai'
import type { OnboardingAnswers } from './types'

// ---------------------------------------------------------------------------
// Rich-enrichment pipeline - ONE instance, mounted at the modal level (never in
// a step: steps remount under AnimatePresence on every navigation, which would
// reset timers and double network work).
//
// Everything flows through `answers` (persisted to localStorage after every
// change), so a reload or the LinkedIn OAuth round-trip resumes exactly where
// the pipeline left off:
//   richStatus 'pending'  -> poll /api/onboarding/enrich/status until terminal
//   terminal              -> fire /api/onboarding/insights once per pipeline
//
// Re-submitting a URL clears richStatus/insights (connect-step), which restarts
// this machine; results from a superseded URL are dropped on arrival.
// ---------------------------------------------------------------------------

const POLL_MS = 5_000
// The scrape lands in 42-60s; past 2.5 minutes we stop and degrade (the server
// keeps its own stale backstop, so a reload won't revive a dead snapshot).
const MAX_POLL_MS = 150_000
// Consecutive 'idle' responses while we believe a scrape is pending mean the
// server has no session row (e.g. migration missing) - it can never resolve.
const MAX_IDLE_STREAK = 3

export function useRichPipeline(answers: OnboardingAnswers, update: (patch: Partial<OnboardingAnswers>) => void) {
    // Refs so the polling loop always sees current values without re-arming.
    const answersRef = React.useRef(answers)
    const updateRef = React.useRef(update)
    React.useEffect(() => {
        answersRef.current = answers
        updateRef.current = update
    })
    // In-flight guard (NOT a fire-once latch): cleared when the call settles, so
    // a re-submitted URL - whose clear of answers.insights re-opens the answers
    // guard below - can generate fresh insights.
    const insightsInFlightRef = React.useRef(false)
    const backfillInFlightRef = React.useRef(false)

    // Merge a terminal status response into answers. richSummary is only written
    // for 'ready'/'empty' - statuses where the server actually observed the
    // profile, so postsCount 0 is a real measurement. A failure must never read
    // as "we found no posts" on the cadence/insight screens.
    const applyTerminal = (rich: NonNullable<Awaited<ReturnType<typeof fetchRichStatus>>>['rich']) => {
        const current = answersRef.current
        const measured = rich.status === 'ready' || rich.status === 'empty'
        updateRef.current({
            richStatus: rich.status,
            ...(measured
                ? {
                      richSummary: {
                          postsCount: rich.postsCount ?? 0,
                          followers: rich.profile?.followers ?? null,
                          observed: rich.observed ?? null,
                          styleHints: rich.styleHints ?? null,
                      },
                  }
                : {}),
            // Fill identity gaps the fast tier missed (e.g. the avatar / About).
            profile: {
                name: current.profile.name || rich.profile?.name || '',
                headline: current.profile.headline || rich.profile?.headline || '',
                avatarUrl: current.profile.avatarUrl || rich.profile?.avatarUrl || '',
            },
            ...(rich.profile?.about && !current.aboutSummary ? { aboutSummary: rich.profile.about } : {}),
        })
    }

    const pending = answers.richStatus === 'pending'
    React.useEffect(() => {
        if (!pending) return
        let stopped = false
        let timer: ReturnType<typeof setTimeout>
        let idleStreak = 0
        const startedAt = Date.now()

        const poll = async () => {
            const status = await fetchRichStatus()
            if (stopped) return
            const rich = status?.rich
            if (rich?.status === 'idle') {
                idleStreak += 1
                if (idleStreak >= MAX_IDLE_STREAK) {
                    track('onb_rich_session_missing')
                    updateRef.current({ richStatus: 'failed' })
                    return
                }
            } else if (rich && rich.status !== 'pending') {
                track('onb_rich_scrape_done', { status: rich.status, postsCount: rich.postsCount ?? 0 })
                applyTerminal(rich)
                return
            } else {
                idleStreak = 0
            }
            if (Date.now() - startedAt >= MAX_POLL_MS) {
                track('onb_rich_scrape_timeout')
                updateRef.current({ richStatus: 'failed' })
                return
            }
            timer = setTimeout(poll, POLL_MS)
        }

        timer = setTimeout(poll, POLL_MS)
        return () => {
            stopped = true
            clearTimeout(timer)
        }
    }, [pending])

    // Backfill: the enrich route can return an already-terminal status (same URL
    // re-submitted, scrape reused) without the poll loop ever running - fetch the
    // summary once so the cadence/insight screens still get their numbers.
    const needsBackfill =
        (answers.richStatus === 'ready' || answers.richStatus === 'empty') && answers.richSummary === undefined
    React.useEffect(() => {
        if (!needsBackfill || backfillInFlightRef.current) return
        backfillInFlightRef.current = true
        fetchRichStatus()
            .then((status) => {
                const rich = status?.rich
                if (!rich || (rich.status !== 'ready' && rich.status !== 'empty')) return
                if (answersRef.current.richSummary !== undefined) return
                applyTerminal(rich)
            })
            .finally(() => {
                backfillInFlightRef.current = false
            })
    }, [needsBackfill])

    // Fire the insights generation once the scrape settles. 'failed'/'unavailable'
    // still fire: the server degrades to profile- or benchmark-kind by itself.
    // The route is idempotent (echoes a stored payload), so a StrictMode double
    // mount can't double-render different results. A result that arrives after
    // the user re-submitted a different URL is dropped.
    const terminal =
        answers.richStatus === 'ready' ||
        answers.richStatus === 'empty' ||
        answers.richStatus === 'failed' ||
        answers.richStatus === 'unavailable'
    React.useEffect(() => {
        if (!terminal || insightsInFlightRef.current) return
        if (answersRef.current.insights || answersRef.current.insightsStatus === 'failed') return
        insightsInFlightRef.current = true
        const firedFor = answersRef.current.profileUrl
        fetchInsights()
            .then((payload) => {
                if (answersRef.current.profileUrl !== firedFor) return
                if (payload) {
                    track('onb_insights_ready', { kind: payload.kind })
                    updateRef.current({ insights: payload, insightsStatus: 'ready' })
                } else {
                    track('onb_insights_failed')
                    updateRef.current({ insightsStatus: 'failed' })
                }
            })
            .finally(() => {
                insightsInFlightRef.current = false
            })
    }, [terminal])
}
