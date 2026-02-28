'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { BookOpen, Briefcase, Coffee, Heart, Laugh, MessageCircle, Sparkles } from 'lucide-react'

import { Tone, TONE_OPTIONS } from '@/config/ai'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const TONE_ICONS: Record<Tone, LucideIcon> = {
    professional: Briefcase,
    casual: Coffee,
    inspirational: Heart,
    educational: BookOpen,
    storytelling: MessageCircle,
    humorous: Laugh,
}

const FEATURE_ITEMS = [
    'Turns ideas into engaging posts',
    'Adapts to your preferred tone',
    'Refine with follow-up prompts',
    'Optimized for LinkedIn algorithm',
    'Add hooks that grab attention',
    'Smart hashtag suggestions',
    'Professional formatting built-in',
    'From draft to polished in seconds',
]

interface ConfigPhaseProps {
    topic: string
    onTopicChange: (topic: string) => void
    tone: Tone
    onToneChange: (tone: Tone) => void
    onGenerate: () => void
    isLoading: boolean
}

function FeatureTicker() {
    const [index, setIndex] = React.useState(0)
    const visibleCount = 3

    React.useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % FEATURE_ITEMS.length)
        }, 2500)
        return () => clearInterval(interval)
    }, [])

    const visibleItems = Array.from({ length: visibleCount }, (_, i) => {
        const itemIndex = (index + i) % FEATURE_ITEMS.length
        return { text: FEATURE_ITEMS[itemIndex], key: `${index}-${i}`, position: i }
    })

    return (
        <div
            className='relative mt-5 flex h-[84px] w-[290px] flex-col items-center overflow-hidden'
            style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
            }}>
            <AnimatePresence mode='popLayout' initial={false}>
                {visibleItems.map((item) => (
                    <motion.div
                        key={item.key}
                        className='text-muted-foreground flex w-full items-center gap-2.5 py-1 text-sm'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: item.position === 1 ? 1 : 0.5, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                        <div className='bg-primary/15 text-primary flex size-5 shrink-0 items-center justify-center rounded-full'>
                            <svg viewBox='0 0 12 12' fill='none' className='size-3'>
                                <path
                                    d='M2.5 6L5 8.5L9.5 3.5'
                                    stroke='currentColor'
                                    strokeWidth='1.5'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                        </div>
                        {item.text}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

export function ConfigPhase({ topic, onTopicChange, tone, onToneChange, onGenerate, isLoading }: ConfigPhaseProps) {
    return (
        <div className='relative flex flex-1 flex-col items-center justify-center px-6 pb-6'>
            {/* Dot grid background fading down */}
            <div
                className='pointer-events-none absolute inset-x-0 top-0 h-72'
                style={{
                    backgroundImage: 'radial-gradient(circle, var(--color-foreground) 1.2px, transparent 1.2px)',
                    backgroundSize: '20px 20px',
                    opacity: 0.15,
                    maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                }}
            />

            {/* Hero */}
            <motion.div
                className='relative flex flex-col items-center pt-4 pb-8'
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <motion.div
                    className='relative mb-4'
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
                    <div className='bg-primary/10 flex size-14 items-center justify-center rounded-2xl'>
                        <Sparkles className='text-primary size-7' />
                    </div>
                    <div className='bg-primary/20 absolute -inset-2 -z-10 rounded-3xl blur-xl' />
                </motion.div>
                <h3 className='font-heading text-lg font-semibold'>AI Writing Assistant</h3>
                <p className='text-muted-foreground mt-1 text-sm'>Craft the perfect LinkedIn post</p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}>
                    <FeatureTicker />
                </motion.div>
            </motion.div>

            {/* Form */}
            <motion.div
                className='flex w-full max-w-md flex-col gap-5'
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                <Textarea
                    id='ai-topic'
                    value={topic}
                    onChange={(e) => onTopicChange(e.target.value)}
                    placeholder='Describe your topic, paste a rough draft, or share an idea...'
                    rows={3}
                    maxLength={2000}
                    disabled={isLoading}
                />

                <div className='flex flex-wrap justify-center gap-1.5' role='radiogroup' aria-label='Tone'>
                    {TONE_OPTIONS.map((option, i) => {
                        const Icon = TONE_ICONS[option.value]
                        return (
                            <motion.button
                                key={option.value}
                                type='button'
                                role='radio'
                                aria-checked={tone === option.value}
                                onClick={() => onToneChange(option.value)}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-all',
                                    tone === option.value
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-transparent',
                                )}>
                                <Icon className='size-3.5' />
                                {option.label}
                            </motion.button>
                        )
                    })}
                </div>

                <Button onClick={onGenerate} disabled={!topic.trim() || isLoading} size='lg' className='w-full gap-2'>
                    <Sparkles className='size-4' />
                    {isLoading ? 'Generating...' : 'Generate Post'}
                </Button>
            </motion.div>
        </div>
    )
}
