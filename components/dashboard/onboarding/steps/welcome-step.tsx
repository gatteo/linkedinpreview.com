'use client'

import { motion } from 'framer-motion'

import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { WelcomeMark } from '@/components/dashboard/illustrations'

export function WelcomeStep() {
    return (
        <motion.div
            variants={staggerContainer}
            initial='hidden'
            animate='visible'
            className='flex flex-col items-center gap-6 py-2 text-center'>
            <motion.div variants={fadeUp} className='w-56'>
                <WelcomeMark />
            </motion.div>
            <motion.div variants={staggerItem} className='flex flex-col gap-2'>
                <h2 className='font-heading text-2xl tracking-tight'>Let&apos;s set up your brand</h2>
                <p className='text-muted-foreground mx-auto max-w-md text-pretty'>
                    A couple of quick questions and we&apos;ll prefill your profile, content strategy, and writing style
                    — so every post you make sounds like you. Takes about two minutes, and you can skip anything.
                </p>
            </motion.div>
        </motion.div>
    )
}
