'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SparklesIcon, TrendingUpIcon } from 'lucide-react'

import { resolveRole, rolePlural, socialProofCount } from '@/config/onboarding-personalization'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { Sub } from '../primitives'

// ---------------------------------------------------------------------------
// Reinforce - a short "you're in good company" beat right after the user pins
// down their role + niche. The count is intentionally fabricated but fully
// deterministic (socialProofCount): the same role + niche always renders the
// same number, so it never looks like it shuffles between renders. It is framed
// as social proof, never as a live, queried metric.
// ---------------------------------------------------------------------------

export function ReinforceStep() {
    const { answers } = useOnboarding()
    const role = resolveRole(answers.role)
    const niche = (answers.niche ?? '').trim()
    const count = socialProofCount(role, niche || 'general')
    const roleWord = rolePlural(role).toLowerCase()
    const nicheLabel = niche || 'your space'
    const display = useCountUp(count)

    React.useEffect(() => {
        track('onb_reinforce_view', { role, niche: nicheLabel })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-6'>
            <motion.div variants={staggerItem} className='flex items-center gap-2.5'>
                <span className='bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-xl'>
                    <SparklesIcon className='size-[18px]' />
                </span>
                <span className='text-muted-foreground font-mono text-[11px] font-semibold tracking-[0.12em] uppercase'>
                    You&apos;re in good company
                </span>
            </motion.div>

            <motion.div variants={fadeUp} className='flex flex-col gap-2.5'>
                <div className='flex items-baseline gap-2.5'>
                    <span className='font-heading text-foreground text-[clamp(48px,8vw,72px)] leading-none font-bold tracking-tight tabular-nums'>
                        {display.toLocaleString()}
                    </span>
                    <TrendingUpIcon className='text-primary size-7' />
                </div>
                <p className='text-foreground text-lg leading-snug text-pretty'>
                    {roleWord} in <span className='text-primary font-semibold'>{nicheLabel}</span> are growing their
                    reach with LinkedInPreview.
                </p>
            </motion.div>

            <motion.div
                variants={staggerItem}
                style={{ background: 'color-mix(in oklch, var(--primary) 6%, transparent)' }}
                className='border-primary/20 rounded-xl border px-[15px] py-[13px]'>
                <Sub className='text-foreground'>
                    The ones who win aren&apos;t the loudest - they&apos;re the most consistent. Let&apos;s set up a
                    system you can actually keep.
                </Sub>
            </motion.div>
        </motion.div>
    )
}

// Ease-out count-up to `target`. rAF-driven so it stays smooth and self-cancels.
// Honors prefers-reduced-motion (the modal's MotionConfig doesn't reach raw rAF):
// reduced-motion users jump straight to the final number.
function useCountUp(target: number, durationMs = 1100): number {
    const reduced = useReducedMotion()
    const [value, setValue] = React.useState(0)
    React.useEffect(() => {
        if (reduced) {
            setValue(target)
            return
        }
        let raf = 0
        let start = 0
        const tick = (t: number) => {
            if (!start) start = t
            const p = Math.min(1, (t - start) / durationMs)
            const eased = 1 - Math.pow(1 - p, 3)
            setValue(Math.round(target * eased))
            if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [target, durationMs, reduced])
    return value
}
