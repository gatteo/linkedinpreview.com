'use client'

import { motion } from 'framer-motion'

import { TONE_OPTIONS, type Tone } from '@/config/ai'
import { toneFromSummary } from '@/config/onboarding-personalization'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { track } from '../ai'
import { useOnboarding } from '../context'

export function VoiceStep() {
    const { answers, update } = useOnboarding()
    const tone: Tone = answers.tone ?? toneFromSummary(answers.toneSummary)

    const choose = (value: Tone) => {
        update({ tone: value })
        track('onb_voice_set', { tone: value })
    }

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-6'>
            <motion.div variants={staggerItem} className='flex flex-col gap-3'>
                <p className='text-foreground text-sm font-medium'>Pick the voice that sounds most like you.</p>
                <div className='flex flex-wrap justify-center gap-2.5'>
                    {TONE_OPTIONS.map((option) => {
                        const selected = tone === option.value
                        return (
                            <button
                                key={option.value}
                                type='button'
                                onClick={() => choose(option.value)}
                                className={cn(
                                    'inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-all',
                                    selected
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-muted/30 text-foreground hover:border-border/80 hover:bg-muted/50',
                                )}>
                                {option.label}
                            </button>
                        )
                    })}
                </div>
            </motion.div>

            <motion.div variants={staggerItem} className='flex flex-col gap-1.5'>
                <Label htmlFor='ob-notes'>Anything we should avoid? (optional)</Label>
                <Input
                    id='ob-notes'
                    value={answers.writingNotes ?? ''}
                    onChange={(e) => update({ writingNotes: e.target.value })}
                    placeholder='e.g. no buzzwords, no emojis, never salesy'
                />
                <p className='text-muted-foreground text-xs'>We&apos;ll apply this to every post we write for you.</p>
            </motion.div>
        </motion.div>
    )
}
