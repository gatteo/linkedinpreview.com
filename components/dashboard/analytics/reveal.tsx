'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

import { fadeUp, transition } from '@/lib/motion'

type RevealProps = {
    children: React.ReactNode
    /** Stagger index - later items animate in slightly after earlier ones. */
    index?: number
    className?: string
}

/**
 * Fades + lifts its children into view on first scroll, using the house motion
 * tokens (`lib/motion`). Reduced motion is honored by the page-level
 * <MotionConfig reducedMotion="user"> wrapper.
 */
export function Reveal({ children, index = 0, className }: RevealProps) {
    return (
        <motion.div
            className={className}
            variants={fadeUp}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, margin: '-60px' }}
            transition={{ ...transition, delay: Math.min(index * 0.06, 0.3) }}>
            {children}
        </motion.div>
    )
}
