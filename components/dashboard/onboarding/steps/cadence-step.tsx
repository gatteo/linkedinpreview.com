'use client'

import { motion } from 'framer-motion'
import { CheckIcon } from 'lucide-react'

import { CADENCE_OPTIONS, postsPerMonth, type Cadence } from '@/config/onboarding-personalization'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'

import { track } from '../ai'
import { useOnboarding } from '../context'

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
            <motion.div variants={staggerItem} className='flex flex-col gap-2.5'>
                {CADENCE_OPTIONS.map((option) => {
                    const isSelected = selected === option.value
                    return (
                        <button
                            key={option.value}
                            type='button'
                            onClick={() => choose(option.value)}
                            className={cn(
                                'flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all',
                                isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border bg-muted/30 hover:border-border/80 hover:bg-muted/50',
                            )}>
                            <div className='flex flex-col'>
                                <span className='text-foreground text-sm font-semibold'>
                                    {option.label}
                                    {option.recommended && (
                                        <span className='bg-primary/10 text-primary ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase'>
                                            Recommended
                                        </span>
                                    )}
                                </span>
                                <span className='text-muted-foreground text-xs'>{option.sub}</span>
                            </div>
                            <span
                                className={cn(
                                    'flex size-5 shrink-0 items-center justify-center rounded-full border',
                                    isSelected
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-muted-foreground/30',
                                )}>
                                {isSelected && <CheckIcon className='size-3' />}
                            </span>
                        </button>
                    )
                })}
            </motion.div>

            <motion.p variants={staggerItem} className='text-muted-foreground text-center text-sm'>
                Great - that&apos;s about{' '}
                <span className='text-foreground font-semibold'>{postsPerMonth(current.frequency)} posts a month</span>.
                We&apos;ll have them ready for you.
            </motion.p>
        </motion.div>
    )
}
