'use client'

import { motion } from 'framer-motion'
import { BriefcaseIcon, MegaphoneIcon, SparklesIcon, TrendingUpIcon, UsersIcon, type LucideIcon } from 'lucide-react'

import { WELCOME_OPTIONS } from '@/config/onboarding-personalization'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'

import { track } from '../ai'
import { useOnboarding } from '../context'

const ICONS: Record<string, LucideIcon> = {
    TrendingUp: TrendingUpIcon,
    Megaphone: MegaphoneIcon,
    Sparkles: SparklesIcon,
    Briefcase: BriefcaseIcon,
    Users: UsersIcon,
}

export function WelcomeStep() {
    const { update, goNext, skipSetup } = useOnboarding()

    const choose = (key: string) => {
        const option = WELCOME_OPTIONS.find((o) => o.key === key)
        if (!option) return
        update({ primaryGoal: option.goal, goals: [option.goal], audience: option.audience })
        track('onb_motivation_select', { goal: option.goal })
        goNext()
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial='hidden'
            animate='visible'
            className='flex flex-col items-center gap-6 py-1 text-center'>
            <motion.div variants={staggerItem} className='flex flex-col gap-2'>
                <h2 className='font-heading text-2xl tracking-tight text-balance'>
                    Let&apos;s turn your LinkedIn into your #1 growth channel.
                </h2>
                <p className='text-muted-foreground mx-auto max-w-md text-pretty'>
                    Two minutes. We&apos;ll set up your voice, your strategy, and your first week of posts, personalized
                    to you.
                </p>
            </motion.div>

            <motion.div variants={fadeUp} className='flex w-full max-w-md flex-col gap-2.5'>
                <p className='text-foreground text-sm font-medium'>What are you here to do?</p>
                {WELCOME_OPTIONS.map((option) => {
                    const Icon = ICONS[option.icon] ?? SparklesIcon
                    return (
                        <button
                            key={option.key}
                            type='button'
                            onClick={() => choose(option.key)}
                            className={cn(
                                'group border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/60 flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all',
                            )}>
                            <span className='bg-background text-primary flex size-9 shrink-0 items-center justify-center rounded-lg border'>
                                <Icon className='size-4.5' />
                            </span>
                            <span className='text-foreground text-sm font-medium'>{option.label}</span>
                        </button>
                    )
                })}
            </motion.div>

            <motion.button
                variants={staggerItem}
                type='button'
                onClick={skipSetup}
                className='text-muted-foreground hover:text-foreground text-xs transition-colors'>
                Skip setup
            </motion.button>
        </motion.div>
    )
}
