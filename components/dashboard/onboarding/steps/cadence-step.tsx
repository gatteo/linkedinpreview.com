'use client'

import { motion } from 'framer-motion'
import { CheckIcon } from 'lucide-react'

import { CADENCE_OPTIONS, postsPerMonth, type Cadence } from '@/config/onboarding-personalization'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { H2, OptionRow, timeAgoLabel } from '../primitives'

const DORMANT_AFTER_DAYS = 45

// Purely additive: an honest observed-rhythm line above the options once the
// rich scrape landed. The default NEVER anchors to a low observed cadence - the
// line creates the gap, the recommended option offers the resolution.
function observedLine(answers: ReturnType<typeof useOnboarding>['answers']): string | null {
    const summary = answers.richSummary
    if (!summary) return null
    const observed = summary.observed
    const dormant =
        observed?.newestPostAt &&
        Date.now() - new Date(observed.newestPostAt).getTime() > DORMANT_AFTER_DAYS * 86_400_000
    if (observed?.postsPerWeek != null && !dormant) {
        return `From your profile: you've been averaging about ${observed.postsPerWeek} posts a week lately.`
    }
    if (dormant && observed?.newestPostAt) {
        return `From your profile: your most recent post was ${timeAgoLabel(observed.newestPostAt)}.`
    }
    if (summary.postsCount > 0) {
        return `From your profile: we found ${summary.postsCount} recent ${summary.postsCount === 1 ? 'post' : 'posts'}.`
    }
    return "From your profile: we couldn't find recent posts - showing up at all is your biggest lever."
}

export function CadenceStep() {
    const { answers, update } = useOnboarding()
    const selected: Cadence = answers.cadence ?? 'recommended-3x'
    const observed = observedLine(answers)

    const choose = (value: Cadence) => {
        const option = CADENCE_OPTIONS.find((c) => c.value === value)
        if (!option) return
        update({ cadence: value, frequency: option.frequency, schedule: option.schedule })
        track('onb_cadence_select', { cadence: value })
    }

    const current = CADENCE_OPTIONS.find((c) => c.value === selected) ?? CADENCE_OPTIONS[1]

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-5'>
            <motion.div variants={staggerItem}>
                <H2 className='text-xl'>How often do you want to show up?</H2>
            </motion.div>

            {observed && (
                <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'color-mix(in oklch, var(--primary) 6%, transparent)' }}
                    className='border-primary/20 text-foreground rounded-xl border px-[15px] py-[11px] text-sm leading-snug'>
                    {observed}
                </motion.p>
            )}

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

            <motion.p variants={staggerItem} className='text-muted-foreground text-sm'>
                Great - that&apos;s about{' '}
                <span className='text-foreground font-semibold'>{postsPerMonth(current.frequency)} posts a month</span>.
                We&apos;ll plan them into your calendar.
            </motion.p>
        </motion.div>
    )
}
