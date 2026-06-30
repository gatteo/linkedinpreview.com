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

export function BuildingStep() {
    const { answers, update, goNext } = useOnboarding()
    const [done, setDone] = React.useState<Set<TaskId>>(new Set())
    const [active, setActive] = React.useState<TaskId | null>(null)
    const ranRef = React.useRef(false)

    React.useEffect(() => {
        if (ranRef.current) return
        ranRef.current = true

        let cancelled = false
        let advanced = false
        const mark = (id: TaskId) =>
            setDone((prev) => {
                const next = new Set(prev)
                next.add(id)
                return next
            })

        const effectiveTopics = answers.topics.filter(Boolean).length
            ? answers.topics.filter(Boolean)
            : answers.niche
              ? [answers.niche]
              : []

        // Advance exactly once. A failsafe timeout guarantees we never trap the
        // user on this footerless, non-dismissable step if the network hangs.
        const advance = (positioning: string, formats: StrategyFormat[]) => {
            if (advanced || cancelled) return
            advanced = true
            update({ positioning, formats, topics: effectiveTopics })
            track('onb_building_done')
            goNext()
        }
        const failsafe = setTimeout(() => advance('', []), 15000)

        async function run() {
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
            if (cancelled) return
            mark('read')

            setActive('positioning')
            const positioningP = (canGenerate ? generatePositioning(body) : Promise.resolve('')).then((v) => {
                if (!cancelled) {
                    mark('positioning')
                    setActive('formats')
                }
                return v
            })
            const formatsP = (canGenerate ? generateFormats(body) : Promise.resolve<StrategyFormat[]>([])).then((v) => {
                if (!cancelled) mark('formats')
                return v
            })

            const [positioning, formats] = await Promise.all([positioningP, formatsP, wait(1100)]).then((r) => [
                r[0],
                r[1],
            ])
            if (cancelled) return

            setActive('ideas')
            await wait(800)
            if (cancelled) return
            mark('ideas')

            setActive('calendar')
            await wait(650)
            if (cancelled) return
            mark('calendar')

            setActive('assemble')
            await wait(600)
            if (cancelled) return
            mark('assemble')
            await wait(450)
            if (cancelled) return

            advance(positioning as string, formats as StrategyFormat[])
        }

        run().catch(() => advance('', []))
        return () => {
            cancelled = true
            clearTimeout(failsafe)
        }
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
                            {task.label}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
