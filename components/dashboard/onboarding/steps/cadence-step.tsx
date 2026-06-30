'use client'

import { motion } from 'framer-motion'
import { CheckIcon } from 'lucide-react'

import { CADENCE_OPTIONS, postsPerMonth, type Cadence } from '@/config/onboarding-personalization'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { H2, OptionRow } from '../primitives'

export function CadenceStep() {
    const { answers, update } = useOnboarding()
    const selected: Cadence = answers.cadence ?? 'recommended-3x'

    const choose = (value: Cadence) => {
        const option = CADENCE_OPTIONS.find((c) => c.value === value)
        if (!option) return
        update({ cadence: value, frequency: option.frequency, schedule: option.schedule })
        track('onb_cadence_select', { cadence: value })
    }

    const current = CADENCE_OPTIONS.find((c) => c.value === selected) ?? CADENCE_OPTIONS[1]

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-5'>
            <motion.div variants={staggerItem} className='text-center'>
                <H2 className='text-xl'>How often do you want to show up?</H2>
            </motion.div>

            <motion.div variants={staggerItem} className='flex flex-col gap-2.5'>
                {CADENCE_OPTIONS.map((option) => {
                    const isSelected = selected === option.value
                    return (
                        <OptionRow
                            key={option.value}
                            selected={isSelected}
                            onClick={() => choose(option.value)}
                            right={
                                <span
                                    className={cn(
                                        'flex size-5 shrink-0 items-center justify-center rounded-full border',
                                        isSelected
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-muted-foreground/35',
                                    )}>
                                    {isSelected && <CheckIcon className='size-3' />}
                                </span>
                            }>
                            <span className='flex flex-col'>
                                <span className='flex items-center gap-2 font-semibold'>
                                    {option.label}
                                    {option.recommended && (
                                        <span className='bg-primary/10 text-primary rounded-full px-[7px] py-0.5 text-[10px] font-semibold tracking-wide uppercase'>
                                            Recommended
                                        </span>
                                    )}
                                </span>
                                <span className='text-muted-foreground text-[12.5px] font-normal'>{option.sub}</span>
                            </span>
                        </OptionRow>
                    )
                })}
            </motion.div>

            <motion.p variants={staggerItem} className='text-muted-foreground text-center text-sm'>
                Great - that&apos;s about{' '}
                <span className='text-foreground font-semibold'>{postsPerMonth(current.frequency)} posts a month</span>.
                We&apos;ll plan them into your calendar.
            </motion.p>
        </motion.div>
    )
}
