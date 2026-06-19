'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckIcon, Loader2Icon } from 'lucide-react'

import { EASE_OUT } from '@/lib/motion'
import { FORMAT_CATEGORIES, type FormatCategory, type StrategyFormat } from '@/lib/strategy'
import { BuildingSetup } from '@/components/dashboard/illustrations'

import type { OnboardingAnswers } from '../types'

type TaskId = 'read' | 'positioning' | 'formats' | 'assemble'

const TASKS: { id: TaskId; label: string }[] = [
    { id: 'read', label: 'Reading your answers' },
    { id: 'positioning', label: 'Writing your positioning' },
    { id: 'formats', label: 'Picking your best post formats' },
    { id: 'assemble', label: 'Putting it all together' },
]

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function generatePositioning(body: object): Promise<string> {
    const res = await fetch('/api/strategy/positioning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!res.ok) return ''
    const data = await res.json()
    return typeof data.statement === 'string' ? data.statement : ''
}

async function generateFormats(body: object): Promise<StrategyFormat[]> {
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
}

type BuildingStepProps = {
    answers: OnboardingAnswers
    onDone: (positioning: string, formats: StrategyFormat[]) => void
}

export function BuildingStep({ answers, onDone }: BuildingStepProps) {
    const [done, setDone] = React.useState<Set<TaskId>>(new Set())
    const [active, setActive] = React.useState<TaskId | null>(null)
    const onDoneRef = React.useRef(onDone)
    onDoneRef.current = onDone

    React.useEffect(() => {
        let cancelled = false
        const mark = (fn: (s: Set<TaskId>) => void) =>
            setDone((prev) => {
                const next = new Set(prev)
                fn(next)
                return next
            })

        async function run() {
            const topics = answers.topics.filter(Boolean)
            const canGenerate =
                !!answers.role && answers.goals.length > 0 && answers.audience.length > 0 && topics.length > 0
            const body = { role: answers.role, goals: answers.goals, audience: answers.audience, topics }

            setActive('read')
            await wait(750)
            if (cancelled) return
            mark((s) => s.add('read'))

            setActive('positioning')
            const positioningP = (canGenerate ? generatePositioning(body) : Promise.resolve('')).then((v) => {
                if (!cancelled) mark((s) => s.add('positioning'))
                return v
            })
            const formatsP = (canGenerate ? generateFormats(body) : Promise.resolve<StrategyFormat[]>([])).then((v) => {
                if (!cancelled) {
                    mark((s) => s.add('formats'))
                    setActive('formats')
                }
                return v
            })

            // Keep the formats row visibly "active" while we wait, even if positioning lands first.
            setActive('positioning')
            const [positioning, formats] = await Promise.all([positioningP, formatsP, wait(900)]).then((r) => [
                r[0],
                r[1],
            ])
            if (cancelled) return

            setActive('assemble')
            await wait(700)
            if (cancelled) return
            mark((s) => s.add('assemble'))
            await wait(450)
            if (cancelled) return
            onDoneRef.current(positioning as string, formats as StrategyFormat[])
        }

        run()
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const progress = Math.round((done.size / TASKS.length) * 100)

    return (
        <div className='flex flex-col items-center gap-6 py-2'>
            <div className='w-48'>
                <BuildingSetup />
            </div>
            <div className='flex flex-col items-center gap-1 text-center'>
                <h2 className='font-heading text-xl tracking-tight'>Building your setup</h2>
                <p className='text-muted-foreground text-sm'>Personalizing everything from your answers…</p>
            </div>

            {/* Progress bar */}
            <div className='bg-muted h-1.5 w-full max-w-xs overflow-hidden rounded-full'>
                <motion.div
                    className='bg-primary h-full rounded-full'
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: EASE_OUT }}
                />
            </div>

            {/* Checklist */}
            <ul className='flex w-full max-w-xs flex-col gap-2.5'>
                {TASKS.map((task) => {
                    const isDone = done.has(task.id)
                    const isActive = active === task.id && !isDone
                    return (
                        <li key={task.id} className={cnState(isDone, isActive)}>
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

function cnState(isDone: boolean, isActive: boolean) {
    return [
        'flex items-center gap-3 text-sm transition-colors',
        isDone ? 'text-foreground' : isActive ? 'text-foreground' : 'text-muted-foreground/60',
    ].join(' ')
}
