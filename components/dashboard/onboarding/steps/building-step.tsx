'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckIcon, Loader2Icon } from 'lucide-react'

import { EASE_OUT } from '@/lib/motion'
import { FORMAT_CATEGORIES, type FormatCategory, type StrategyFormat } from '@/lib/strategy'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { H2, Spinner, Sub } from '../primitives'

type TaskId = 'read' | 'positioning' | 'formats' | 'ideas' | 'calendar' | 'assemble'

const TASKS: { id: TaskId; label: string }[] = [
    { id: 'read', label: 'Reading your answers' },
    { id: 'positioning', label: 'Writing your positioning statement' },
    { id: 'formats', label: 'Choosing your best-fit post formats' },
    { id: 'ideas', label: 'Planning your first week' },
    { id: 'calendar', label: 'Setting your calendar' },
    { id: 'assemble', label: 'Putting it all together' },
]

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

// Extra hold while the rich scrape is still landing, so the insight cards right
// after almost never show a loader.
const RICH_WAIT_MS = 12000

export function BuildingStep() {
    const { answers, update, goNext } = useOnboarding()
    const [done, setDone] = React.useState<Set<TaskId>>(new Set())
    const [active, setActive] = React.useState<TaskId | null>(null)
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
        const mark = (id: TaskId) =>
            setDone((prev) => {
                const next = new Set(prev)
                next.add(id)
                return next
            })

        // Chosen topics, else the topics we actually read in their posts, else niche.
        const topicsNow = () => {
            const current = answersRef.current
            const chosen = current.topics.filter(Boolean)
            if (chosen.length) return chosen
            if (current.insights?.currentTopics.length) return current.insights.currentTopics.slice(0, 3)
            return current.niche ? [current.niche] : []
        }

        // Idempotent: whichever reaches here first (the run, its catch, or the
        // failsafe) advances once. We deliberately don't gate the work on a
        // per-mount "cancelled" flag - in StrictMode the cleanup would set it and
        // the second setup would early-return on startedRef, stranding the user on
        // this footerless step forever (the reported "stuck loading" bug).
        const advance = (positioning: string, formats: StrategyFormat[]) => {
            if (advancedRef.current) return
            advancedRef.current = true
            update({ positioning, formats, topics: topicsNow() })
            track('onb_building_done')
            goNext()
        }

        // Re-armed on every mount so a StrictMode remount (which cleared the prior
        // timer) always has a live failsafe. Wider when we may hold for the scrape.
        const failsafeMs = answers.richStatus === 'pending' ? 15000 + RICH_WAIT_MS : 15000
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

            setActive('read')
            await wait(700)
            mark('read')

            setActive('positioning')
            const positioningP = (canGenerate ? generatePositioning(body) : Promise.resolve('')).then((v) => {
                mark('positioning')
                setActive('formats')
                return v
            })
            const formatsP = (canGenerate ? generateFormats(body) : Promise.resolve<StrategyFormat[]>([])).then((v) => {
                mark('formats')
                return v
            })

            const [positioning, formats] = await Promise.all([positioningP, formatsP, wait(1100)]).then((r) => [
                r[0],
                r[1],
            ])

            setActive('ideas')
            await wait(800)
            mark('ideas')

            setActive('calendar')
            await wait(650)
            mark('calendar')

            setActive('assemble')
            // Hold (bounded) while the rich scrape is still landing.
            const richWaitStart = Date.now()
            while (answersRef.current.richStatus === 'pending' && Date.now() - richWaitStart < RICH_WAIT_MS) {
                await wait(600)
            }
            await wait(600)
            mark('assemble')
            await wait(450)

            advance(positioning as string, formats as StrategyFormat[])
        }

        // Start the work (and its AI calls) exactly once across StrictMode remounts.
        if (!startedRef.current) {
            startedRef.current = true
            run().catch(() => advance('', []))
        }

        return () => clearTimeout(failsafe)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const progress = Math.round((done.size / TASKS.length) * 100)

    return (
        <div className='flex flex-col items-center gap-6 py-3'>
            <div
                style={{
                    background:
                        'linear-gradient(150deg, color-mix(in oklch, var(--primary) 16%, transparent), color-mix(in oklch, var(--primary) 4%, transparent))',
                }}
                className='text-primary flex size-[60px] items-center justify-center rounded-[18px]'>
                <Spinner className='size-[26px]' />
            </div>
            <div className='flex flex-col items-center gap-1 text-center'>
                <H2 className='text-[22px]'>Building your system</H2>
                <Sub>Assembling everything around your goal...</Sub>
            </div>

            <div className='bg-muted h-1.5 w-full max-w-[260px] overflow-hidden rounded-full'>
                <motion.div
                    className='bg-primary h-full rounded-full'
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: EASE_OUT }}
                />
            </div>

            <ul className='flex w-full max-w-[280px] flex-col gap-2.5'>
                {TASKS.map((task) => {
                    const isDone = done.has(task.id)
                    const isActive = active === task.id && !isDone
                    const postsCount = answers.richSummary?.postsCount ?? 0
                    const label =
                        task.id === 'read' && postsCount > 1
                            ? `Reading your last ${postsCount} posts`
                            : task.id === 'read' && postsCount === 1
                              ? 'Reading your latest post'
                              : task.label
                    return (
                        <li
                            key={task.id}
                            className={`flex items-center gap-3 text-sm transition-colors ${
                                isDone || isActive ? 'text-foreground' : 'text-muted-foreground/55'
                            }`}>
                            <span className='flex size-5 shrink-0 items-center justify-center'>
                                <AnimatePresence mode='wait' initial={false}>
                                    {isDone ? (
                                        <motion.span
                                            key='done'
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.3, ease: EASE_OUT }}
                                            className='bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full'>
                                            <CheckIcon className='size-3' />
                                        </motion.span>
                                    ) : isActive ? (
                                        <Loader2Icon key='spin' className='text-primary size-4 animate-spin' />
                                    ) : (
                                        <span
                                            key='idle'
                                            className='border-muted-foreground/30 size-4 rounded-full border'
                                        />
                                    )}
                                </AnimatePresence>
                            </span>
                            {label}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
