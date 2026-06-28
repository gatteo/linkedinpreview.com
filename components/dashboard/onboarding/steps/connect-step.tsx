'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, LinkedinIcon, ShieldCheckIcon } from 'lucide-react'

import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { track } from '../ai'
import { useOnboarding } from '../context'

const ERROR_COPY: Record<string, string> = {
    denied: 'No problem - you can paste your profile URL or set it up manually.',
    error: "That didn't go through. Try again, paste your URL, or skip for now.",
    session: 'Your session expired. Try connecting again.',
    unavailable: 'LinkedIn connect is briefly unavailable. Paste your URL instead.',
}

export function ConnectStep() {
    const { answers, update, goNext, connectLinkedin, linkedinError } = useOnboarding()
    const [showUrl, setShowUrl] = React.useState(false)
    const [url, setUrl] = React.useState(answers.profileUrl ?? '')

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
                        Reading your profile to personalize everything next.
                    </p>
                </motion.div>
            </motion.div>
        )
    }

    const useUrl = () => {
        update({ profileUrl: url.trim() })
        track('onb_connect_method', { method: 'url' })
        goNext()
    }

    const connect = () => {
        track('onb_connect_method', { method: 'oauth' })
        connectLinkedin()
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial='hidden'
            animate='visible'
            className='flex flex-col items-center gap-5 py-1 text-center'>
            <motion.div
                variants={fadeUp}
                className='bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl'>
                <LinkedinIcon className='size-7' />
            </motion.div>
            <motion.div variants={staggerItem} className='flex flex-col gap-1.5'>
                <h2 className='font-heading text-xl tracking-tight text-balance'>
                    Connect LinkedIn so everything is about <span className='italic'>you</span>.
                </h2>
                <p className='text-muted-foreground mx-auto max-w-sm text-sm text-pretty'>
                    We read your headline and how you already write, then tailor your whole setup. Takes 5 seconds.
                </p>
            </motion.div>

            <motion.div variants={staggerItem} className='flex w-full max-w-xs flex-col gap-3'>
                <Button onClick={connect} className='w-full' size='lg'>
                    <LinkedinIcon className='size-4' />
                    Connect LinkedIn
                </Button>
                <p className='text-muted-foreground flex items-center justify-center gap-1.5 text-xs'>
                    <ShieldCheckIcon className='size-3.5' />
                    Official LinkedIn login. We never post without your say-so.
                </p>
                {linkedinError && ERROR_COPY[linkedinError] && (
                    <p className='text-muted-foreground text-xs'>{ERROR_COPY[linkedinError]}</p>
                )}

                {showUrl ? (
                    <div className='flex flex-col gap-2 pt-1'>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder='linkedin.com/in/your-name'
                            autoFocus
                            className='text-center'
                        />
                        <Button variant='secondary' onClick={useUrl} disabled={!url.trim()}>
                            Use this profile
                        </Button>
                    </div>
                ) : (
                    <button
                        type='button'
                        onClick={() => setShowUrl(true)}
                        className='text-muted-foreground hover:text-foreground text-xs transition-colors'>
                        Or paste your profile URL
                    </button>
                )}
            </motion.div>
        </motion.div>
    )
}
