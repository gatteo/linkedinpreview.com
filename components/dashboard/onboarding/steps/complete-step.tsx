'use client'

import { motion } from 'framer-motion'
import { CheckIcon } from 'lucide-react'

import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import type { StrategyFormat } from '@/lib/strategy'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SetupComplete } from '@/components/dashboard/illustrations'

import type { OnboardingAnswers } from '../types'

type CompleteStepProps = {
    answers: OnboardingAnswers
    update: (patch: Partial<OnboardingAnswers>) => void
}

export function CompleteStep({ answers, update }: CompleteStepProps) {
    const firstName = answers.profile.name.trim().split(' ')[0]
    const hasFormats = answers.formats.length > 0

    const toggleFormat = (index: number) => {
        const next = answers.formats.map((f, i) => (i === index ? { ...f, enabled: !f.enabled } : f))
        update({ formats: next })
    }

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-5'>
            <motion.div variants={fadeUp} className='flex flex-col items-center gap-2 text-center'>
                <div className='w-40'>
                    <SetupComplete />
                </div>
                <h2 className='font-heading text-2xl tracking-tight'>
                    {firstName ? `You're all set, ${firstName}!` : "You're all set!"}
                </h2>
                <p className='text-muted-foreground max-w-md text-sm text-pretty'>
                    Here&apos;s what we put together. Tweak anything now, or refine it later from your dashboard.
                </p>
            </motion.div>

            {answers.positioning && (
                <motion.div variants={staggerItem} className='flex flex-col gap-1.5'>
                    <Label htmlFor='ob-positioning'>Your positioning</Label>
                    <Textarea
                        id='ob-positioning'
                        value={answers.positioning}
                        onChange={(e) => update({ positioning: e.target.value })}
                        rows={3}
                        className='resize-none'
                    />
                </motion.div>
            )}

            {hasFormats && (
                <motion.div variants={staggerItem} className='flex flex-col gap-2'>
                    <Label>Suggested post formats</Label>
                    <div className='flex flex-wrap gap-2'>
                        {answers.formats.map((format: StrategyFormat, i) => (
                            <button
                                key={`${format.name}-${i}`}
                                type='button'
                                onClick={() => toggleFormat(i)}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                                    format.enabled
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50',
                                )}>
                                {format.enabled && <CheckIcon className='size-3' />}
                                {format.name}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {!answers.positioning && !hasFormats && (
                <motion.p variants={staggerItem} className='text-muted-foreground text-center text-sm'>
                    Your profile is ready. You can build out your full strategy anytime from the dashboard.
                </motion.p>
            )}
        </motion.div>
    )
}
