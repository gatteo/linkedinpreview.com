'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2Icon, ChevronDownIcon, ChevronUpIcon, CircleIcon, RocketIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type StepId = 'write-first-post' | 'set-up-branding' | 'try-ai-suggestions' | 'preview-feed' | 'copy-publish'

interface Step {
    id: StepId
    label: string
    href: string
}

const STEPS: Step[] = [
    { id: 'write-first-post', label: 'Write your first post', href: '/dashboard/editor' },
    { id: 'set-up-branding', label: 'Set up your branding', href: '/dashboard/branding' },
    { id: 'try-ai-suggestions', label: 'Try AI suggestions', href: '/dashboard/editor' },
    { id: 'preview-feed', label: 'Preview in realistic feed', href: '/dashboard/editor' },
    { id: 'copy-publish', label: 'Copy and publish', href: '/dashboard/editor' },
]

const STORAGE_KEY = 'lp-getting-started'

interface PersistedState {
    checked: StepId[]
    collapsed: boolean
}

function loadState(): PersistedState {
    if (typeof window === 'undefined') return { checked: [], collapsed: false }
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { checked: [], collapsed: false }
        return JSON.parse(raw) as PersistedState
    } catch {
        return { checked: [], collapsed: false }
    }
}

function saveState(state: PersistedState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
        // localStorage unavailable - silently ignore
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GettingStartedChecklist() {
    const [checked, setChecked] = React.useState<Set<StepId>>(new Set())
    const [collapsed, setCollapsed] = React.useState(false)
    const [hydrated, setHydrated] = React.useState(false)

    React.useEffect(() => {
        const state = loadState()
        setChecked(new Set(state.checked))
        setCollapsed(state.collapsed)
        setHydrated(true)
    }, [])

    const completedCount = checked.size
    const totalCount = STEPS.length
    const allDone = completedCount === totalCount

    const toggleStep = React.useCallback(
        (id: StepId) => {
            setChecked((prev) => {
                const next = new Set(prev)
                if (next.has(id)) {
                    next.delete(id)
                } else {
                    next.add(id)
                }
                saveState({ checked: Array.from(next), collapsed })
                return next
            })
        },
        [collapsed],
    )

    const toggleCollapsed = React.useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev
            saveState({ checked: Array.from(checked), collapsed: next })
            return next
        })
    }, [checked])

    // Don't render until hydrated (avoids SSR mismatch) or when all steps done
    if (!hydrated || allDone) return null

    const progressPct = Math.round((completedCount / totalCount) * 100)

    return (
        <div className='mx-2 mb-2 rounded-lg border'>
            {/* Header row */}
            <button
                type='button'
                onClick={toggleCollapsed}
                className='hover:bg-muted/50 flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors'>
                <RocketIcon className='text-primary size-4 shrink-0' />
                <div className='min-w-0 flex-1'>
                    <p className='text-sm leading-none font-medium'>Getting started</p>
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                        {completedCount} of {totalCount} steps done
                    </p>
                </div>
                {collapsed ? (
                    <ChevronUpIcon className='text-muted-foreground size-4 shrink-0' />
                ) : (
                    <ChevronDownIcon className='text-muted-foreground size-4 shrink-0' />
                )}
            </button>

            {/* Progress bar */}
            <div className='px-3 pb-1'>
                <div className='bg-muted h-1 w-full overflow-hidden rounded-full'>
                    <div
                        className='bg-primary h-full rounded-full transition-all duration-300'
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            {/* Steps list */}
            {!collapsed && (
                <ul className='px-2 pt-1 pb-2'>
                    {STEPS.map((step) => {
                        const done = checked.has(step.id)
                        return (
                            <li key={step.id} className='flex items-start gap-2 rounded-md px-1 py-1.5'>
                                {/* Checkbox toggle */}
                                <button
                                    type='button'
                                    onClick={() => toggleStep(step.id)}
                                    className='focus-visible:ring-ring mt-0.5 shrink-0 rounded focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none'
                                    aria-label={
                                        done ? `Mark "${step.label}" as incomplete` : `Mark "${step.label}" as complete`
                                    }>
                                    {done ? (
                                        <CheckCircle2Icon className='text-primary size-4' />
                                    ) : (
                                        <CircleIcon className='text-muted-foreground size-4' />
                                    )}
                                </button>

                                {/* Label + description */}
                                <Link href={step.href} className='group min-w-0 flex-1'>
                                    <p
                                        className={cn(
                                            'group-hover:text-foreground text-xs leading-tight transition-colors',
                                            done ? 'text-muted-foreground line-through' : 'text-foreground',
                                        )}>
                                        {step.label}
                                    </p>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
