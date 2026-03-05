'use client'

import type { ReactNode } from 'react'
import { BriefcaseIcon, Building2Icon, MegaphoneIcon, NewspaperIcon, TrendingUpIcon } from 'lucide-react'

import { STRATEGY_GOALS, type StrategyGoal } from '@/lib/strategy'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GoalsStepProps = {
    value: StrategyGoal[]
    onChange: (value: StrategyGoal[]) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOAL_ICONS: Record<string, ReactNode> = {
    TrendingUp: <TrendingUpIcon className='size-4' />,
    Megaphone: <MegaphoneIcon className='size-4' />,
    Briefcase: <BriefcaseIcon className='size-4' />,
    Building2: <Building2Icon className='size-4' />,
    Newspaper: <NewspaperIcon className='size-4' />,
}

const MAX_GOALS = 3

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GoalsStep({ value, onChange }: GoalsStepProps) {
    const toggle = (goal: StrategyGoal) => {
        if (value.includes(goal)) {
            onChange(value.filter((g) => g !== goal))
        } else if (value.length < MAX_GOALS) {
            onChange([...value, goal])
        }
    }

    return (
        <div className='flex flex-wrap justify-center gap-3'>
            {STRATEGY_GOALS.map((goal) => {
                const selected = value.includes(goal.value)
                const disabled = !selected && value.length >= MAX_GOALS
                return (
                    <button
                        key={goal.value}
                        type='button'
                        disabled={disabled}
                        onClick={() => toggle(goal.value)}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                            selected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-muted/30 text-foreground hover:border-border/80 hover:bg-muted/50',
                            disabled && 'pointer-events-none opacity-40',
                        )}>
                        {GOAL_ICONS[goal.icon]}
                        {goal.label}
                    </button>
                )
            })}
        </div>
    )
}
