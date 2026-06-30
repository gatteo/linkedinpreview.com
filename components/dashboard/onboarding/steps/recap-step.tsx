'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { CalendarDaysIcon, FileTextIcon, MicIcon, TargetIcon, type LucideIcon } from 'lucide-react'

import { TONE_OPTIONS } from '@/config/ai'
import { cadenceOption, goalRestated, postsPerMonth, toneFromSummary } from '@/config/onboarding-personalization'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { firstName, H2, Sub } from '../primitives'

export function RecapStep() {
    const { answers } = useOnboarding()
    const fn = firstName(answers.profile.name)
    const tone = answers.tone ?? toneFromSummary(answers.toneSummary)
    const toneLabel = TONE_OPTIONS.find((t) => t.value === tone)?.label ?? 'Professional'
    const cadence = cadenceOption(answers.cadence)
    const snippet = (answers.firstPostText ?? '').replace(/\*\*/g, '').split('\n').filter(Boolean)[0] ?? ''

    React.useEffect(() => {
        track('onb_recap_view')
    }, [])

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-[18px]'>
            <motion.div variants={fadeUp} className='text-center'>
                <H2>{fn ? `${fn}, your LinkedIn system is ready.` : 'Your LinkedIn system is ready.'}</H2>
                <Sub className='mx-auto mt-1.5 max-w-[440px]'>
                    Positioning, voice, your first post, and a posting calendar - all set up around your goal to{' '}
                    <span className='text-foreground font-medium'>{goalRestated(answers.primaryGoal)}</span>.
                </Sub>
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
                {snippet && (
                    <RecapRow icon={FileTextIcon} label='First post, ready to publish'>
                        {snippet}
                    </RecapRow>
                )}
                <RecapRow icon={CalendarDaysIcon} label='Your calendar'>
                    {cadence.label} · {postsPerMonth(cadence.frequency)} posts a month planned
                </RecapRow>
            </motion.div>
        </motion.div>
    )
}

function RecapRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
    return (
        <div className='border-border bg-muted/30 flex items-start gap-3 rounded-xl border px-[15px] py-[13px]'>
            <span className='bg-card border-border text-primary flex size-9 shrink-0 items-center justify-center rounded-[10px] border'>
                <Icon className='size-[17px]' />
            </span>
            <div className='flex min-w-0 flex-col'>
                <span className='text-muted-foreground text-xs font-medium'>{label}</span>
                <span className='text-foreground line-clamp-2 text-sm'>{children}</span>
            </div>
        </div>
    )
}
