'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { CalendarDaysIcon, FileTextIcon, MicIcon, TargetIcon } from 'lucide-react'

import { TONE_OPTIONS } from '@/config/ai'
import { cadenceOption, goalRestated, postsPerMonth, toneFromSummary } from '@/config/onboarding-personalization'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'

import { track } from '../ai'
import { useOnboarding } from '../context'

export function RecapStep() {
    const { answers } = useOnboarding()
    const firstName = answers.profile.name.trim().split(' ')[0]
    const tone = answers.tone ?? toneFromSummary(answers.toneSummary)
    const toneLabel = TONE_OPTIONS.find((t) => t.value === tone)?.label ?? 'Professional'
    const cadence = cadenceOption(answers.cadence)
    const firstPostSnippet = (answers.firstPostText ?? '').replace(/\*\*/g, '').split('\n').filter(Boolean)[0] ?? ''

    React.useEffect(() => {
        track('onb_recap_view')
    }, [])

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-5'>
            <motion.div variants={fadeUp} className='flex flex-col gap-1 text-center'>
                <h2 className='font-heading text-2xl tracking-tight text-balance'>
                    {firstName ? `${firstName}, your LinkedIn system is ready.` : 'Your LinkedIn system is ready.'}
                </h2>
                <p className='text-muted-foreground mx-auto max-w-md text-sm text-pretty'>
                    Positioning, voice, your first post, and a month of ideas, all set up around your goal to{' '}
                    <span className='text-foreground font-medium'>{goalRestated(answers.primaryGoal)}</span>.
                </p>
            </motion.div>

            <motion.div variants={staggerItem} className='flex flex-col gap-2.5'>
                {answers.positioning && (
                    <RecapRow icon={TargetIcon} label='Your positioning'>
                        {answers.positioning}
                    </RecapRow>
                )}
                <RecapRow icon={MicIcon} label='Your voice'>
                    {toneLabel}
                </RecapRow>
                {firstPostSnippet && (
                    <RecapRow icon={FileTextIcon} label='First post, ready to publish'>
                        {firstPostSnippet}
                    </RecapRow>
                )}
                <RecapRow icon={CalendarDaysIcon} label='Your calendar'>
                    {cadence.label} · {postsPerMonth(cadence.frequency)} posts a month planned
                </RecapRow>
            </motion.div>
        </motion.div>
    )
}

function RecapRow({
    icon: Icon,
    label,
    children,
}: {
    icon: typeof TargetIcon
    label: string
    children: React.ReactNode
}) {
    return (
        <div className='border-border bg-muted/30 flex items-start gap-3 rounded-xl border p-3.5'>
            <span className='bg-background text-primary flex size-9 shrink-0 items-center justify-center rounded-lg border'>
                <Icon className='size-4.5' />
            </span>
            <div className='flex min-w-0 flex-col'>
                <span className='text-muted-foreground text-xs font-medium'>{label}</span>
                <span className='text-foreground line-clamp-2 text-sm'>{children}</span>
            </div>
        </div>
    )
}
