'use client'

import { motion } from 'framer-motion'

import { TONE_OPTIONS, type Tone } from '@/config/ai'
import { toneFromSummary } from '@/config/onboarding-personalization'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { Input } from '@/components/ui/input'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { FieldLabel, Pill } from '../primitives'

export function VoiceStep() {
    const { answers, update } = useOnboarding()
    const tone: Tone = answers.tone ?? toneFromSummary(answers.toneSummary)

    const choose = (value: Tone) => {
        update({ tone: value })
        track('onb_voice_set', { tone: value })
    }

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-[26px]'>
            <motion.div variants={staggerItem} className='flex flex-col gap-3'>
                <FieldLabel>Pick the voice that sounds most like you.</FieldLabel>
                <div className='flex flex-wrap justify-center gap-2.5'>
                    {TONE_OPTIONS.map((option) => (
                        <Pill key={option.value} selected={tone === option.value} onClick={() => choose(option.value)}>
                            {option.label}
                        </Pill>
                    ))}
                </div>
            </motion.div>

            <motion.div variants={staggerItem} className='flex flex-col gap-[7px]'>
                <FieldLabel>
                    Anything we should avoid? <span className='text-muted-foreground font-normal'>(optional)</span>
                </FieldLabel>
                <Input
                    value={answers.writingNotes ?? ''}
                    onChange={(e) => update({ writingNotes: e.target.value })}
                    placeholder='e.g. no buzzwords, no emojis, never salesy'
                />
                <p className='text-muted-foreground text-xs'>We&apos;ll apply this to every post we write for you.</p>
            </motion.div>
        </motion.div>
    )
}
