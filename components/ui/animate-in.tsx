'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'

type AnimateInProps = {
    children: ReactNode
    className?: string
    delay?: number
    duration?: number
    from?: 'bottom' | 'left' | 'right' | 'fade'
    once?: boolean
}

const variants = {
    bottom: {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
    },
    left: {
        hidden: { opacity: 0, x: -24 },
        visible: { opacity: 1, x: 0 },
    },
    right: {
        hidden: { opacity: 0, x: 24 },
        visible: { opacity: 1, x: 0 },
    },
    fade: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    },
}

export function AnimateIn({
    children,
    className,
    delay = 0,
    duration = 0.5,
    from = 'bottom',
    once = true,
}: AnimateInProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once, margin: '-80px' })

    return (
        <motion.div
            ref={ref}
            className={className}
            initial='hidden'
            animate={isInView ? 'visible' : 'hidden'}
            variants={variants[from]}
            transition={{
                duration,
                delay,
                ease: [0.16, 1, 0.3, 1],
            }}>
            {children}
        </motion.div>
    )
}

export function StaggerChildren({
    children,
    className,
    staggerDelay = 0.08,
}: {
    children: ReactNode
    className?: string
    staggerDelay?: number
}) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-80px' })

    return (
        <motion.div
            ref={ref}
            className={className}
            initial='hidden'
            animate={isInView ? 'visible' : 'hidden'}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}>
            {children}
        </motion.div>
    )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            className={className}
            variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
            }}
            transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
            }}>
            {children}
        </motion.div>
    )
}
