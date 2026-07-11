'use client'

import { motion } from 'framer-motion'
import { ClockIcon, SparklesIcon, StarIcon } from 'lucide-react'

import { SOCIAL_PROOF } from '@/config/social-proof'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { Button } from '@/components/ui/button'

import { track } from '../ai'
import { useOnboarding } from '../context'

// ---------------------------------------------------------------------------
// 00 · Welcome - the landing hook, rendered over the full-bleed hero stage.
// Goal-neutral on purpose: nothing is known about the visitor yet.
// ---------------------------------------------------------------------------

export function WelcomeStep() {
    const { goNext } = useOnboarding()

    const start = () => {
        track('onb_welcome_start')
        goNext()
    }

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col'>
            <motion.h1
                variants={staggerItem}
                className='font-heading mb-4 text-[clamp(34px,5vw,56px)] leading-[1.02] font-bold tracking-[-0.035em] text-[oklch(0.98_0.01_90)] [text-shadow:0_1px_24px_oklch(0.14_0.03_222_/_0.5)]'>
                Grow <span className='text-[var(--orange-300)]'>10×</span> on LinkedIn in 90 days.
            </motion.h1>
            <motion.p
                variants={staggerItem}
                className='mb-6 max-w-[40ch] text-[17px] leading-[1.55] text-[oklch(0.92_0.02_200/0.85)]'>
                I&rsquo;ll audit your LinkedIn, learn your goals, and build a personalized strategy, all in under 2
                minutes.
            </motion.p>
            <motion.div variants={staggerItem}>
                <Button
                    onClick={start}
                    className='font-heading h-auto w-fit gap-2 rounded-xl px-[52px] py-[15px] text-base font-semibold tracking-[-0.01em]'>
                    Let&rsquo;s start
                </Button>
            </motion.div>
            <motion.div variants={staggerItem} className='mt-5 flex flex-nowrap gap-2 max-sm:flex-wrap'>
                <HeroPill>
                    <StarIcon className='size-[13px] fill-[var(--orange-300)] text-[var(--orange-300)]' />
                    <b className='font-bold'>{SOCIAL_PROOF.rating}</b>&nbsp;from {SOCIAL_PROOF.count} professionals
                </HeroPill>
                <HeroPill>
                    <SparklesIcon className='size-3.5 text-[var(--orange-300)]' />
                    Personalized strategy
                </HeroPill>
                <HeroPill>
                    <ClockIcon className='size-3.5 text-[var(--orange-300)]' />
                    90 seconds
                </HeroPill>
            </motion.div>
        </motion.div>
    )
}

function HeroPill({ children }: { children: React.ReactNode }) {
    return (
        <span className='inline-flex items-center gap-1.5 rounded-full border border-[oklch(1_0_0/0.24)] bg-[oklch(1_0_0/0.12)] px-3 py-[7px] text-[12.5px] whitespace-nowrap text-[oklch(0.96_0.01_90)] backdrop-blur-[4px]'>
            {children}
        </span>
    )
}
