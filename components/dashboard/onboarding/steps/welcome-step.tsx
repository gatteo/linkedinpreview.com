'use client'

import { motion } from 'framer-motion'
import { CheckIcon, HelpCircleIcon } from 'lucide-react'

import { WELCOME_OPTIONS } from '@/config/onboarding-personalization'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { iconFor } from '../icons'
import { H2, OptionRow, Sub } from '../primitives'

export function WelcomeStep() {
    const { answers, update, goNext } = useOnboarding()
    // Selection lives in answers (not local state) so leaving and coming back to
    // this step - which remounts it - restores exactly what the user picked.
    const selected = answers.welcomeSelections ?? []

    const toggle = (key: string) =>
        update({ welcomeSelections: selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key] })

    const submit = () => {
        if (selected.length === 0) return
        const chosen = WELCOME_OPTIONS.filter((o) => selected.includes(o.key))
        const goals = Array.from(new Set(chosen.map((o) => o.goal)))
        // Only overwrite when we have real goals - "Other / not sure" alone must
        // not wipe goals/audience seeded by a partial/returning setup.
        if (goals.length > 0) {
            // Cap at 3 to match the audience limit the Goal step enforces.
            const audience = Array.from(new Set(chosen.flatMap((o) => o.audience))).slice(0, 3)
            update({ goals, primaryGoal: goals[0], audience })
        }
        track('onb_motivation_select', { goal: goals[0], goals, count: selected.length })
        goNext()
    }

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-[22px]'>
            <motion.div variants={staggerItem} className='flex flex-col gap-1.5'>
                <H2 className='max-w-[470px]'>Let&apos;s turn your LinkedIn into your #1 growth channel</H2>
                <Sub>What are you here to do? Pick all that apply.</Sub>
            </motion.div>

            <motion.div variants={fadeUp} className='flex w-full flex-col gap-2.5'>
                {WELCOME_OPTIONS.map((option) => {
                    const isSelected = selected.includes(option.key)
                    return (
                        <OptionRow
                            key={option.key}
                            icon={iconFor(option.icon)}
                            selected={isSelected}
                            onClick={() => toggle(option.key)}
                            right={<Tick on={isSelected} />}>
                            {option.label}
                        </OptionRow>
                    )
                })}
                <OptionRow
                    icon={HelpCircleIcon}
                    selected={selected.includes('other')}
                    onClick={() => toggle('other')}
                    right={<Tick on={selected.includes('other')} />}>
                    Other / I&apos;m not sure yet
                </OptionRow>
            </motion.div>

            <motion.div variants={staggerItem}>
                <Button onClick={submit} disabled={selected.length === 0} className='w-full'>
                    Continue
                </Button>
            </motion.div>
        </motion.div>
    )
}

function Tick({ on }: { on: boolean }) {
    return (
        <span
            className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/35',
            )}>
            {on && <CheckIcon className='size-3' />}
        </span>
    )
}
