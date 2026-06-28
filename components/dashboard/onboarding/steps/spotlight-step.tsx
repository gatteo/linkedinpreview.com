'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { BarChart3Icon, CalendarDaysIcon, LayoutGridIcon, LightbulbIcon, type LucideIcon } from 'lucide-react'

import { SPOTLIGHT_CONTENT } from '@/config/onboarding-personalization'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'

import { track } from '../ai'
import { useOnboarding } from '../context'

const ICONS: Record<string, LucideIcon> = {
    BarChart3: BarChart3Icon,
    CalendarDays: CalendarDaysIcon,
    LayoutGrid: LayoutGridIcon,
    Lightbulb: LightbulbIcon,
}

export function SpotlightStep() {
    const { roleContent } = useOnboarding()
    const feature = roleContent.spotlight
    const content = SPOTLIGHT_CONTENT[feature]
    const Icon = ICONS[content.icon] ?? LightbulbIcon

    React.useEffect(() => {
        track('onb_spotlight_view', { feature })
    }, [feature])

    return (
        <motion.div
            variants={staggerContainer}
            initial='hidden'
            animate='visible'
            className='flex flex-col items-center gap-5 py-3 text-center'>
            <motion.div
                variants={fadeUp}
                className='from-primary/15 to-primary/5 text-primary flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br'>
                <Icon className='size-9' />
            </motion.div>
            <motion.div variants={staggerItem} className='flex flex-col gap-2'>
                <span className='text-primary text-xs font-medium tracking-wide uppercase'>{content.eyebrow}</span>
                <h2 className='font-heading mx-auto max-w-md text-xl tracking-tight text-balance'>
                    {content.headline}
                </h2>
                <p className='text-muted-foreground mx-auto max-w-sm text-sm text-pretty'>{content.line}</p>
            </motion.div>
            <motion.span
                variants={staggerItem}
                className='bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium'>
                Included in your plan
            </motion.span>
        </motion.div>
    )
}
