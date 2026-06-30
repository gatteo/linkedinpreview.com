'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { BarChart3Icon, CalendarDaysIcon, LayoutGridIcon, LightbulbIcon, type LucideIcon } from 'lucide-react'

import { SPOTLIGHT_CONTENT } from '@/config/onboarding-personalization'
import { popIn, staggerContainer, staggerItem } from '@/lib/motion'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { H2, Sub } from '../primitives'

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
            className='flex flex-col items-center gap-5 py-2.5 text-center'>
            <motion.div
                variants={popIn}
                style={{
                    background:
                        'linear-gradient(150deg, color-mix(in oklch, var(--primary) 18%, transparent), color-mix(in oklch, var(--primary) 5%, transparent))',
                }}
                className='text-primary flex size-[78px] items-center justify-center rounded-3xl'>
                <Icon className='size-[34px]' />
            </motion.div>
            <motion.div variants={staggerItem} className='flex flex-col items-center gap-2'>
                <span className='text-primary tracking-label font-mono text-[11.5px] font-semibold uppercase'>
                    {content.eyebrow}
                </span>
                <H2 className='max-w-[420px] text-xl'>{content.headline}</H2>
                <Sub className='max-w-[360px]'>{content.line}</Sub>
            </motion.div>
            <motion.span
                variants={staggerItem}
                className='bg-primary/10 text-primary rounded-full px-3 py-[5px] text-xs font-medium'>
                In your toolkit
            </motion.span>
        </motion.div>
    )
}
