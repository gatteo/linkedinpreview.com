'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { TriangleAlertIcon } from 'lucide-react'

import { FETCHING_TASKS, languagesLabel } from '@/config/onboarding-flow'
import { getRoleContent, resolveRole, toneFromSummary } from '@/config/onboarding-personalization'
import type { StrategyAudience } from '@/lib/strategy'

import { enrichProfile, track } from '../ai'
import { useOnboarding } from '../context'
import { CTA, GhostLink, H1, LoaderBlock, Sub } from '../primitives'

// ---------------------------------------------------------------------------
// 02 · Fetching - the fast profile fetch behind a checklist loader. Fires the
// enrich call exactly once (StrictMode-safe), animates the checklist while it
// runs, commits the result into answers, and auto-advances to Reassure. The
// enrich response also hands the rich-scrape status to the pipeline hook,
// which starts the background polling the question steps then mask.
// ---------------------------------------------------------------------------

const MAX_AUDIENCE = 3
const TICK_MS = 950
// Just past the client enrich timeout (28s): only a call that never settles hits this.
const FAILSAFE_MS = 30000

// The failure card used to always blame a LinkedIn block, even when the real
// reason (surfaced via fetchFailReason) was our own fetch timing out or a
// provider rate-limit - neither of which is "LinkedIn blocked us". Bucket the
// server's reason into honest copy instead of one hardcoded message.
function failureCopy(reason: string | undefined): { title: string; body: string } {
    if (reason === 'timeout' || reason === 'aborted' || reason === 'network')
        return {
            title: 'That took longer than expected',
            body: "Fetching your profile timed out, so we couldn't pull your details automatically. You can try again, or continue and tell us about you in two taps.",
        }
    if (reason?.startsWith('http-4') || reason === 'empty-record')
        return {
            title: "We're briefly unable to fetch profiles",
            body: 'Our profile lookup is temporarily unavailable. You can try again shortly, or continue and tell us about you in two taps.',
        }
    return {
        title: "We couldn't read that profile",
        body: "LinkedIn blocked the request, so we couldn't pull your details automatically. You can try another URL, or continue and tell us about you in two taps.",
    }
}

export function FetchingStep() {
    const { answers, update, goNext, goBack, goTo } = useOnboarding()
    const [doneCount, setDoneCount] = React.useState(0)
    const [failed, setFailed] = React.useState(false)
    const [failReason, setFailReason] = React.useState<string | undefined>(undefined)
    // Refs survive a StrictMode setup/cleanup/setup cycle: startedRef keeps the
    // enrich call from firing twice, settledRef keeps us committing once.
    const startedRef = React.useRef(false)
    const settledRef = React.useRef(false)
    const answersRef = React.useRef(answers)
    React.useEffect(() => {
        answersRef.current = answers
    })

    const hasUrl = !!answers.profileUrl
    const connected = answers.linkedinConnected

    React.useEffect(() => {
        // Nothing to fetch (deep link / stale resume): skip the theater entirely.
        if (!hasUrl && !connected) {
            goTo('goal')
            return
        }

        // Ticks stall on the last item until the fetch actually settles.
        const tickTimer = setInterval(() => {
            setDoneCount((c) => Math.min(c + 1, FETCHING_TASKS.length - 1))
        }, TICK_MS)

        const finish = (result: Awaited<ReturnType<typeof enrichProfile>>) => {
            if (settledRef.current) return
            settledRef.current = true
            clearTimeout(failsafe)
            clearInterval(tickTimer)

            const live = answersRef.current
            const role = resolveRole(result?.role)
            const primaryAudience = result?.primaryAudience as StrategyAudience | undefined
            const nextAudience =
                primaryAudience && !live.audience.includes(primaryAudience)
                    ? [primaryAudience, ...live.audience].slice(0, MAX_AUDIENCE)
                    : live.audience
            const fetchedProfile = result?.profile
            const identity = fetchedProfile?.identity

            update({
                role: live.role || role,
                niche: result?.niche || live.niche || '',
                audience: nextAudience,
                toneSummary: result?.toneSummary || live.toneSummary || '',
                tone: live.tone ?? toneFromSummary(result?.toneSummary),
                opportunityLine: result?.opportunityLine || getRoleContent(role).mirrorOpportunity,
                enrichConfidence: result?.confidence ?? 0,
                mirrorFetchOk: !!fetchedProfile,
                // Hand the rich-scrape state to the pipeline hook ('pending'
                // starts the background polling that feeds the audit report).
                // Never downgrade a scrape the pipeline already settled.
                ...(result?.rich &&
                result.rich !== 'idle' &&
                (live.richStatus === undefined || live.richStatus === 'pending')
                    ? { richStatus: result.rich }
                    : {}),
                // Fill empty identity fields from the real fetched profile; omit
                // the key entirely otherwise so a concurrent pipeline write survives.
                ...(fetchedProfile
                    ? {
                          profile: {
                              name: live.profile.name || fetchedProfile.name,
                              headline: live.profile.headline || fetchedProfile.headline,
                              avatarUrl: live.profile.avatarUrl || fetchedProfile.avatarUrl,
                          },
                          ...(fetchedProfile.about && !live.aboutSummary ? { aboutSummary: fetchedProfile.about } : {}),
                      }
                    : {}),
                ...(identity ? { identity, language: live.language || languagesLabel(identity) } : {}),
            })

            const ok = !!fetchedProfile || connected
            if (ok) {
                track('onb_fetch_done', { found: !!fetchedProfile, rich: result?.rich ?? 'idle' })
                setDoneCount(FETCHING_TASKS.length)
                setTimeout(goNext, 500)
            } else {
                track('onb_fetch_failed', { reason: result?.fetchFailReason ?? 'unknown' })
                setFailReason(result?.fetchFailReason)
                setFailed(true)
            }
        }

        // Re-armed every mount so a StrictMode remount can't leave us without one.
        const failsafe = setTimeout(() => finish(null), FAILSAFE_MS)

        if (!startedRef.current) {
            startedRef.current = true
            const minTheater = new Promise((r) => setTimeout(r, TICK_MS * FETCHING_TASKS.length))
            Promise.all([
                enrichProfile({
                    name: answers.profile.name || undefined,
                    headline: answers.profile.headline || undefined,
                    profileUrl: answers.profileUrl || undefined,
                    welcomeGoal: answers.primaryGoal,
                }),
                minTheater,
            ]).then(([result]) => finish(result))
        }

        return () => {
            clearTimeout(failsafe)
            clearInterval(tickTimer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // A pasted URL we couldn't read - own the failure instead of silently
    // degrading, with copy matched to the actual reason (see failureCopy).
    if (failed) {
        const copy = failureCopy(failReason)
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='flex flex-col items-center py-4 text-center'>
                <div className='bg-destructive/10 text-destructive mb-5 flex size-14 items-center justify-center rounded-2xl'>
                    <TriangleAlertIcon className='size-7' />
                </div>
                <H1 className='text-xl'>{copy.title}</H1>
                <Sub className='mx-auto text-center'>{copy.body}</Sub>
                <div className='flex w-full max-w-[320px] flex-col gap-2.5'>
                    <CTA
                        onClick={() => {
                            track('onb_fetch_failed_action', { action: 'retry' })
                            goBack()
                        }}>
                        Try a different URL
                    </CTA>
                    <GhostLink
                        onClick={() => {
                            track('onb_fetch_failed_action', { action: 'manual' })
                            goTo('goal')
                        }}>
                        Continue without my data
                    </GhostLink>
                </div>
            </motion.div>
        )
    }

    return (
        <LoaderBlock
            title='Connecting to LinkedIn.'
            status={`I'm ${FETCHING_TASKS[Math.min(doneCount, FETCHING_TASKS.length - 1)]?.toLowerCase()}…`}
            steps={FETCHING_TASKS}
            doneCount={doneCount}
        />
    )
}
