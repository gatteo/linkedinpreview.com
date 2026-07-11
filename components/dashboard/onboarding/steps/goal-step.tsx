'use client'

import { AnimatePresence } from 'framer-motion'

import { OB_GOALS, type ObGoal } from '@/config/onboarding-flow'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { iconFor } from '../icons'
import { ChoiceCard, CTA, firstName, H1, Reaction } from '../primitives'

// ---------------------------------------------------------------------------
// 04 · Goal (rail 1/5) - the primary outcome. Drives copy across the recap,
// reinforce, paywall pricing headline, and the projected goal metric.
// ---------------------------------------------------------------------------

const MAX_AUDIENCE = 3

export function GoalStep() {
    const { answers, update, goNext } = useOnboarding()
    const fn = firstName(answers.profile.name)
    const selected = answers.goalId

    const choose = (goal: ObGoal) => {
        // The picked audience leads; earlier entries (from a partial setup) keep
        // their spot behind it so nothing the user chose is silently dropped.
        const audience = Array.from(new Set([...goal.audience, ...answers.audience])).slice(0, MAX_AUDIENCE)
        update({ goalId: goal.id, primaryGoal: goal.goal, goals: [goal.goal], audience })
        track('onb_goal_select', { goal: goal.id })
    }

    const reaction = selected ? OB_GOALS.find((g) => g.id === selected) : null

    return (
        <div className='flex flex-col'>
            <H1 className='mb-5'>
                {fn ? `${fn}, what’s your #1 goal in the next 90 days?` : 'What’s your #1 goal in the next 90 days?'}
            </H1>
            <div className='mb-[18px] grid gap-2.5'>
                {OB_GOALS.map((goal) => (
                    <ChoiceCard
                        key={goal.id}
                        icon={iconFor(goal.icon)}
                        title={goal.title}
                        desc={goal.desc}
                        selected={selected === goal.id}
                        onClick={() => choose(goal)}
                    />
                ))}
            </div>
            <AnimatePresence initial={false}>
                {reaction && (
                    <Reaction
                        key={reaction.id}
                        reaction={{
                            lead: reaction.reaction.lead,
                            body: reaction.reaction.body.replace('{first}', fn || 'friend'),
                        }}
                    />
                )}
            </AnimatePresence>
            <CTA
                onClick={() => {
                    track('onb_goal_confirm')
                    goNext()
                }}
                disabled={!selected}>
                Continue
            </CTA>
        </div>
    )
}
