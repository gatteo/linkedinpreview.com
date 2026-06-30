'use client'

import { motion } from 'framer-motion'
import { HelpCircleIcon } from 'lucide-react'

import { WELCOME_OPTIONS } from '@/config/onboarding-personalization'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { iconFor } from '../icons'
import { H2, OptionRow } from '../primitives'

export function WelcomeStep() {
    const { update, goNext, skipSetup } = useOnboarding()

    const choose = (key: string) => {
        const option = WELCOME_OPTIONS.find((o) => o.key === key)
        if (!option) return
        update({ primaryGoal: option.goal, goals: [option.goal], audience: option.audience })
        track('onb_motivation_select', { goal: option.goal })
        goNext()
    }

    const chooseOther = () => {
        track('onb_motivation_select', { goal: 'other' })
        goNext()
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial='hidden'
            animate='visible'
            className='flex flex-col items-center gap-[22px] text-center'>
            <motion.div variants={staggerItem}>
                <H2 className='max-w-[470px]'>Let&apos;s turn your LinkedIn into your #1 growth channel</H2>
            </motion.div>

            <motion.div variants={fadeUp} className='flex w-full max-w-[440px] flex-col gap-2.5'>
                {WELCOME_OPTIONS.map((option) => (
                    <OptionRow key={option.key} icon={iconFor(option.icon)} onClick={() => choose(option.key)}>
                        {option.label}
                    </OptionRow>
                ))}
                <OptionRow icon={HelpCircleIcon} onClick={chooseOther}>
                    Other / I don&apos;t know
                </OptionRow>
            </motion.div>

            <motion.button
                variants={staggerItem}
                type='button'
                onClick={skipSetup}
                className='text-muted-foreground hover:text-foreground text-xs transition-colors'>
                Skip setup
            </motion.button>
        </motion.div>
    )
}
