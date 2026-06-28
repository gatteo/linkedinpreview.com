'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BriefcaseIcon, Building2Icon, MegaphoneIcon, NewspaperIcon, TrendingUpIcon } from 'lucide-react'

import { staggerContainer, staggerItem } from '@/lib/motion'
import { STRATEGY_GOALS, type StrategyAudience, type StrategyGoal } from '@/lib/strategy'
import { cn } from '@/lib/utils'
import { AudienceStep } from '@/components/dashboard/strategy/wizard-steps/audience-step'

import { useOnboarding } from '../context'

const GOAL_ICONS: Record<string, ReactNode> = {
    TrendingUp: <TrendingUpIcon className='size-4' />,
    Megaphone: <MegaphoneIcon className='size-4' />,
    Briefcase: <BriefcaseIcon className='size-4' />,
    Building2: <Building2Icon className='size-4' />,
    Newspaper: <NewspaperIcon className='size-4' />,
}

const MAX_AUDIENCE = 3

export function GoalStep() {
    const { answers, update } = useOnboarding()
    const primaryGoal = answers.primaryGoal ?? answers.goals[0]

    const chooseGoal = (goal: StrategyGoal) => update({ primaryGoal: goal, goals: [goal] })

    const setAudience = (next: StrategyAudience[]) => update({ audience: next.slice(0, MAX_AUDIENCE) })

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-6'>
            <motion.div variants={staggerItem} className='flex flex-col gap-3'>
                <p className='text-foreground text-sm font-medium'>What does winning look like for you?</p>
                <div className='flex flex-wrap justify-center gap-2.5'>
                    {STRATEGY_GOALS.map((goal) => {
                        const selected = primaryGoal === goal.value
                        return (
                            <button
                                key={goal.value}
                                type='button'
                                onClick={() => chooseGoal(goal.value)}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                                    selected
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-muted/30 text-foreground hover:border-border/80 hover:bg-muted/50',
                                )}>
                                {GOAL_ICONS[goal.icon]}
                                {goal.label}
                            </button>
                        )
                    })}
                </div>
            </motion.div>

            <motion.div variants={staggerItem} className='flex flex-col gap-3'>
                <p className='text-foreground text-sm font-medium'>
                    Who are you writing for? <span className='text-muted-foreground font-normal'>(up to 3)</span>
                </p>
                <AudienceStep value={answers.audience} onChange={setAudience} />
            </motion.div>
        </motion.div>
    )
}
