'use client'

import { motion } from 'framer-motion'
import { CheckIcon, LinkedinIcon, SparklesIcon, UserCheckIcon, ZapIcon } from 'lucide-react'

import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

import type { OnboardingAnswers } from '../types'

const PERKS = [
    { icon: UserCheckIcon, text: 'Pulls in your name and photo automatically' },
    { icon: SparklesIcon, text: 'Previews look exactly like the real thing' },
    { icon: ZapIcon, text: 'Lets you publish straight to LinkedIn later' },
]

const ERROR_COPY: Record<string, string> = {
    denied: 'No problem — you can connect LinkedIn anytime from settings.',
    error: "That didn't go through. You can try again or skip for now.",
    session: 'Your session expired. Try connecting again.',
    unavailable: 'LinkedIn connect is briefly unavailable. You can skip for now.',
}

type LinkedinStepProps = {
    answers: OnboardingAnswers
    onConnect: () => void
    error?: string | null
}

export function LinkedinStep({ answers, onConnect, error }: LinkedinStepProps) {
    if (answers.linkedinConnected) {
        return (
            <motion.div
                variants={staggerContainer}
                initial='hidden'
                animate='visible'
                className='flex flex-col items-center gap-5 py-4 text-center'>
                <motion.div variants={fadeUp} className='relative'>
                    <Avatar className='ring-primary/30 size-20 ring-2'>
                        <AvatarImage src={answers.profile.avatarUrl} alt={answers.profile.name} />
                        <AvatarFallback className='text-lg'>
                            {answers.profile.name.slice(0, 1).toUpperCase() || '?'}
                        </AvatarFallback>
                    </Avatar>
                    <span className='bg-primary text-primary-foreground absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full'>
                        <CheckIcon className='size-4' />
                    </span>
                </motion.div>
                <motion.div variants={staggerItem} className='flex flex-col gap-1'>
                    <h2 className='font-heading text-xl tracking-tight'>
                        {answers.profile.name ? `Connected as ${answers.profile.name}` : 'LinkedIn connected'}
                    </h2>
                    <p className='text-muted-foreground text-sm'>
                        We pulled in your profile. Let&apos;s fine-tune the rest.
                    </p>
                </motion.div>
            </motion.div>
        )
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial='hidden'
            animate='visible'
            className='flex flex-col items-center gap-5 py-2 text-center'>
            <motion.div
                variants={fadeUp}
                className='bg-primary/10 text-primary flex size-16 items-center justify-center rounded-2xl'>
                <LinkedinIcon className='size-8' />
            </motion.div>
            <motion.div variants={staggerItem} className='flex flex-col gap-1'>
                <h2 className='font-heading text-xl tracking-tight'>Connect your LinkedIn</h2>
                <p className='text-muted-foreground mx-auto max-w-sm text-sm text-pretty'>
                    The fastest way to set up. We&apos;ll use it to personalize everything — and you can skip it.
                </p>
            </motion.div>
            <motion.ul variants={staggerItem} className='flex w-full max-w-xs flex-col gap-2.5 text-left'>
                {PERKS.map((perk) => (
                    <li key={perk.text} className='flex items-center gap-2.5 text-sm'>
                        <span className='bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full'>
                            <perk.icon className='size-3.5' />
                        </span>
                        <span className='text-foreground/80'>{perk.text}</span>
                    </li>
                ))}
            </motion.ul>
            <motion.div variants={staggerItem} className='flex w-full max-w-xs flex-col gap-2'>
                <Button onClick={onConnect} className='w-full' size='lg'>
                    <LinkedinIcon className='size-4' />
                    Connect LinkedIn
                </Button>
                {error && ERROR_COPY[error] && <p className='text-muted-foreground text-xs'>{ERROR_COPY[error]}</p>}
            </motion.div>
        </motion.div>
    )
}
