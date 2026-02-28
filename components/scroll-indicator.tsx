'use client'

import { motion, useScroll } from 'framer-motion'

export function ScrollIndicator() {
    const { scrollYProgress } = useScroll()

    return (
        <motion.div
            className='bg-primary fixed inset-x-0 top-0 z-50 h-1 origin-[0%]'
            style={{
                scaleX: scrollYProgress,
            }}
        />
    )
}
