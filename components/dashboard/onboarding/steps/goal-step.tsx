'use client'

import { motion } from 'framer-motion'

import { staggerContainer, staggerItem } from '@/lib/motion'
import { STRATEGY_AUDIENCES, STRATEGY_GOALS, type StrategyAudience, type StrategyGoal } from '@/lib/strategy'

import { useOnboarding } from '../context'
import { iconFor } from '../icons'
import { FieldLabel, Pill } from '../primitives'

const MAX_AUDIENCE = 3

export function GoalStep() {
    const { answers, update } = useOnboarding()
    const primaryGoal = answers.primaryGoal ?? answers.goals[0]

    const chooseGoal = (goal: StrategyGoal) => update({ primaryGoal: goal, goals: [goal] })

    const toggleAudience = (value: StrategyAudience) => {
        const has = answers.audience.includes(value)
        const next = has ? answers.audience.filter((a) => a !== value) : [...answers.audience, value]
        update({ audience: next.slice(0, MAX_AUDIENCE) })
    }

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-[26px]'>
            <motion.div variants={staggerItem} className='flex flex-col gap-3'>
                <FieldLabel>What does winning look like for you?</FieldLabel>
                <div className='flex flex-wrap justify-center gap-2.5'>
                    {STRATEGY_GOALS.map((goal) => (
                        <Pill
                            key={goal.value}
                            icon={iconFor(goal.icon)}
                            selected={primaryGoal === goal.value}
                            onClick={() => chooseGoal(goal.value)}>
                            {goal.label}
                        </Pill>
                    ))}
                </div>
            </motion.div>

            <motion.div variants={staggerItem} className='flex flex-col gap-3'>
                <FieldLabel>
                    Who are you writing for? <span className='text-muted-foreground font-normal'>(up to 3)</span>
                </FieldLabel>
                <div className='flex flex-wrap justify-center gap-2.5'>
                    {STRATEGY_AUDIENCES.map((audience) => {
                        const selected = answers.audience.includes(audience.value)
                        const disabled = !selected && answers.audience.length >= MAX_AUDIENCE
                        return (
                            <Pill
                                key={audience.value}
                                icon={iconFor(audience.icon)}
                                selected={selected}
                                disabled={disabled}
                                onClick={() => toggleAudience(audience.value)}>
                                {audience.label}
                            </Pill>
                        )
                    })}
                </div>
            </motion.div>
        </motion.div>
    )
}
