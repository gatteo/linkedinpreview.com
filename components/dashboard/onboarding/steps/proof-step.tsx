'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { QuoteIcon, SparklesIcon } from 'lucide-react'

import { goalRestated, TESTIMONIALS } from '@/config/onboarding-personalization'
import { popIn, staggerContainer, staggerItem } from '@/lib/motion'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { H2, InitialAvatar, Sub } from '../primitives'

export function ProofStep() {
    const { role, answers } = useOnboarding()
    const testimonial = TESTIMONIALS[role]

    React.useEffect(() => {
        track('onb_proof_view', { role, hasTestimonial: !!testimonial })
    }, [role, testimonial])

    // No real, consented testimonial for this role yet: show an honest value beat
    // rather than fabricated social proof.
    if (!testimonial) {
        return (
            <motion.div
                variants={staggerContainer}
                initial='hidden'
                animate='visible'
                className='flex flex-col items-center gap-5 py-2 text-center'>
                <motion.div
                    variants={popIn}
                    style={{
                        background:
                            'linear-gradient(150deg, color-mix(in oklch, var(--primary) 18%, transparent), color-mix(in oklch, var(--primary) 5%, transparent))',
                    }}
                    className='text-primary flex size-[68px] items-center justify-center rounded-[20px]'>
                    <SparklesIcon className='size-8' />
                </motion.div>
                <motion.div variants={staggerItem} className='flex flex-col items-center gap-2'>
                    <H2 className='max-w-[420px] text-xl'>The hard part isn&apos;t writing. It&apos;s showing up.</H2>
                    <Sub className='max-w-[380px]'>
                        Everything here is built to help you {goalRestated(answers.primaryGoal)}, consistently - without
                        the daily blank-page grind.
                    </Sub>
                </motion.div>
            </motion.div>
        )
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial='hidden'
            animate='visible'
            className='flex flex-col items-center gap-6 py-1.5 text-center'>
            {testimonial.metric && (
                <motion.div variants={popIn} className='flex flex-col items-center gap-1.5'>
                    <span className='font-heading text-primary text-[40px] leading-none font-bold tracking-[-0.03em]'>
                        {testimonial.metric}
                    </span>
                </motion.div>
            )}

            <motion.div
                variants={staggerItem}
                className='border-border bg-muted/30 flex w-full max-w-[410px] flex-col gap-3 rounded-[18px] border p-5 text-left'>
                <QuoteIcon className='text-primary/45 size-6' />
                <p className='text-foreground text-[14.5px] leading-relaxed text-pretty'>{testimonial.quote}</p>
                <div className='flex items-center gap-[11px]'>
                    <InitialAvatar name={testimonial.name} size={38} />
                    <div className='flex flex-col'>
                        <span className='text-foreground text-[13.5px] font-semibold'>{testimonial.name}</span>
                        <span className='text-muted-foreground text-xs'>{testimonial.title}</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
