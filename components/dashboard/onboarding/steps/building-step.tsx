'use client'

import * as React from 'react'

import { BUILDING_TASKS } from '@/config/onboarding-flow'
import { FORMAT_CATEGORIES, type FormatCategory, type StrategyFormat } from '@/lib/strategy'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { LoaderBlock } from '../primitives'

// ---------------------------------------------------------------------------
// 12 · Building - masks the real work behind an
// audit-themed checklist: the positioning + formats AI calls fire here, and the
// step holds (bounded) while the rich scrape and the insights payload land so
// the reveal right after almost never shows a loader.
// ---------------------------------------------------------------------------

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function generatePositioning(body: object): Promise<string> {
    try {
        const res = await fetch('/api/strategy/positioning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        if (!res.ok) return ''
        const data = await res.json()
        return typeof data.statement === 'string' ? data.statement : ''
    } catch {
        return ''
    }
}

async function generateFormats(body: object): Promise<StrategyFormat[]> {
    try {
        const res = await fetch('/api/strategy/formats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        if (!res.ok) return []
        const data = await res.json()
        if (!Array.isArray(data.formats)) return []
        return data.formats.map((f: { name: string; enabled: boolean; category: FormatCategory }) => ({
            name: f.name,
            enabled: f.enabled,
            category: FORMAT_CATEGORIES[f.name] ?? f.category,
        }))
    } catch {
        return []
    }
}

// Extra hold while the rich scrape / insights are still landing, so the audit
// report right after opens on real data instead of a loader.
const RICH_WAIT_MS = 12000
const INSIGHTS_WAIT_MS = 10000

export function BuildingStep() {
    const { answers, update, goNext } = useOnboarding()
    const [doneCount, setDoneCount] = React.useState(0)
    // Both refs survive a StrictMode setup/cleanup/setup cycle: startedRef keeps
    // the AI calls from firing twice, advancedRef keeps us advancing exactly once.
    const startedRef = React.useRef(false)
    const advancedRef = React.useRef(false)
    // Live answers for the long-running effect (the rich scrape and insights can
    // land mid-run; topics should pick them up at commit time).
    const answersRef = React.useRef(answers)
    React.useEffect(() => {
        answersRef.current = answers
    })

    React.useEffect(() => {
        // Chosen topics, else the topics we actually read in their posts, else niche.
        const topicsNow = () => {
            const current = answersRef.current
            const chosen = current.topics.filter(Boolean)
            if (chosen.length) return chosen
            if (current.insights?.currentTopics.length) return current.insights.currentTopics.slice(0, 3)
            return current.niche ? [current.niche] : []
        }

        // Idempotent: whichever reaches here first (the run, its catch, or the
        // failsafe) advances once. No per-mount "cancelled" flag on purpose - in
        // StrictMode the cleanup would set it and the second setup would
        // early-return on startedRef, stranding the user on this CTA-less step.
        const advance = (positioning: string, formats: StrategyFormat[]) => {
            if (advancedRef.current) return
            advancedRef.current = true
            update({ positioning, formats, topics: topicsNow() })
            track('onb_building_done')
            goNext()
        }

        // Re-armed on every mount so a StrictMode remount (which cleared the prior
        // timer) always has a live failsafe. Wider when we may hold for the scrape.
        const failsafeMs = 15000 + (answers.richStatus === 'pending' ? RICH_WAIT_MS + INSIGHTS_WAIT_MS : 0)
        const failsafe = setTimeout(() => advance('', []), failsafeMs)

        async function run() {
            const effectiveTopics = topicsNow()
            const canGenerate =
                !!answers.role && answers.goals.length > 0 && answers.audience.length > 0 && effectiveTopics.length > 0
            const body = {
                role: answers.role,
                goals: answers.goals,
                audience: answers.audience,
                topics: effectiveTopics,
            }

            // Kick both AI calls immediately; the checklist ticks on its own clock.
            const positioningP = canGenerate ? generatePositioning(body) : Promise.resolve('')
            const formatsP = canGenerate ? generateFormats(body) : Promise.resolve<StrategyFormat[]>([])

            await wait(1100)
            setDoneCount(1)

            // Hold (bounded) while the rich scrape is still landing.
            const richWaitStart = Date.now()
            while (answersRef.current.richStatus === 'pending' && Date.now() - richWaitStart < RICH_WAIT_MS) {
                await wait(600)
            }
            setDoneCount(2)

            // Then (bounded) while the insights payload is still generating.
            const insightsWaitStart = Date.now()
            while (
                !answersRef.current.insights &&
                answersRef.current.insightsStatus !== 'failed' &&
                !!answersRef.current.richStatus &&
                answersRef.current.richStatus !== 'idle' &&
                Date.now() - insightsWaitStart < INSIGHTS_WAIT_MS
            ) {
                await wait(600)
            }
            setDoneCount(3)

            const [positioning, formats] = await Promise.all([positioningP, formatsP])
            await wait(900)
            setDoneCount(4)
            await wait(450)

            advance(positioning, formats)
        }

        // Start the work (and its AI calls) exactly once across StrictMode remounts.
        if (!startedRef.current) {
            startedRef.current = true
            run().catch(() => advance('', []))
        }

        return () => clearTimeout(failsafe)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const postsCount = answers.richSummary?.postsCount ?? 0
    const tasks = BUILDING_TASKS.map((t, i) =>
        i === 0 && postsCount > 1 ? `Scoring your last ${postsCount} posts` : t,
    )

    return (
        <LoaderBlock
            title='Auditing your LinkedIn.'
            status={doneCount >= 3 ? 'Compiling your report…' : 'Scoring what you’ve published…'}
            steps={tasks}
            doneCount={doneCount}
        />
    )
}
