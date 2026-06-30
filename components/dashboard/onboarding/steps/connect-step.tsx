'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, LinkedinIcon, ShieldCheckIcon } from 'lucide-react'

import { isLikelyProfileUrl } from '@/lib/linkedin/profile-url'
import { EASE_OUT, fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { H2, initials, Stagger, Sub } from '../primitives'

const ERROR_COPY: Record<string, string> = {
    denied: 'No problem - paste your profile URL or set it up manually.',
    error: "That didn't go through. Try again, paste your URL, or skip for now.",
    session: 'Your session expired. Try connecting again.',
    unavailable: 'LinkedIn connect is briefly unavailable. Paste your URL instead.',
}

export function ConnectStep() {
    const { answers, update, goNext, connectLinkedin, linkedinError } = useOnboarding()
    const [url, setUrl] = React.useState(answers.profileUrl ?? '')
    const [urlError, setUrlError] = React.useState(false)

    if (answers.linkedinConnected) {
        return (
            <div className='flex flex-col items-center gap-[18px] py-4 text-center'>
                <motion.div
                    initial={{ opacity: 0, scale: 0.985, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: EASE_OUT }}
                    className='relative'>
                    <Avatar className='ring-primary/30 size-[84px] ring-[3px]'>
                        <AvatarImage src={answers.profile.avatarUrl} alt={answers.profile.name} />
                        <AvatarFallback
                            style={{
                                background: 'linear-gradient(150deg, var(--petrol-400), var(--petrol-700))',
                                color: 'oklch(0.98 0.01 90)',
                            }}
                            className='text-[30px] font-semibold tracking-tight'>
                            {initials(answers.profile.name) || '?'}
                        </AvatarFallback>
                    </Avatar>
                    <span className='bg-primary text-primary-foreground absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full ring-[3px] ring-[var(--card)]'>
                        <CheckIcon className='size-[15px]' />
                    </span>
                </motion.div>
                <Stagger className='items-center gap-1.5'>
                    <H2 className='text-xl'>
                        {answers.profile.name ? `Connected as ${answers.profile.name}` : 'LinkedIn connected'}
                    </H2>
                    <Sub>We imported your name and photo. Next we&apos;ll tailor your setup.</Sub>
                </Stagger>
                <Button onClick={goNext} size='lg' className='h-11 px-6 text-[15px]'>
                    Continue
                </Button>
            </div>
        )
    }

    const submitUrl = () => {
        const trimmed = url.trim()
        if (!trimmed) return
        if (!isLikelyProfileUrl(trimmed)) {
            setUrlError(true)
            return
        }
        setUrlError(false)
        update({ profileUrl: trimmed })
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
            className='flex flex-col items-center gap-5 text-center'>
            <motion.div
                variants={fadeUp}
                className='bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl'>
                <LinkedinIcon className='size-7' />
            </motion.div>
            <motion.div variants={staggerItem} className='flex max-w-[400px] flex-col gap-1.5'>
                <H2 className='text-xl'>
                    Make your setup about <span className='italic'>you</span>.
                </H2>
                <Sub className='mx-auto max-w-[390px]'>
                    Connect to import your name and photo, or paste your public profile URL and we&apos;ll read what we
                    can - your headline and recent posts - to tailor everything.
                </Sub>
            </motion.div>

            <motion.div variants={staggerItem} className='flex w-full max-w-[320px] flex-col gap-3'>
                <Button onClick={connect} size='lg' className='h-11 w-full text-[15px]'>
                    <LinkedinIcon className='size-[17px]' />
                    Connect LinkedIn
                </Button>
                <p className='text-muted-foreground flex items-center justify-center gap-1.5 text-xs'>
                    <ShieldCheckIcon className='size-3.5' />
                    Official LinkedIn login
                </p>

                <div className='my-0.5 flex items-center gap-3'>
                    <span className='bg-border h-px flex-1' />
                    <span className='text-muted-foreground font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase'>
                        or
                    </span>
                    <span className='bg-border h-px flex-1' />
                </div>

                <div className='flex flex-col gap-2 text-left'>
                    <p className='text-foreground text-[13px] font-medium'>Paste your profile URL</p>
                    <Input
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value)
                            if (urlError) setUrlError(false)
                        }}
                        placeholder='linkedin.com/in/your-name'
                        aria-invalid={urlError}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') submitUrl()
                        }}
                    />
                    {urlError ? (
                        <p className='text-destructive text-xs'>
                            That doesn&apos;t look like a profile URL. It should look like linkedin.com/in/your-name.
                        </p>
                    ) : (
                        <p className='text-muted-foreground text-xs'>
                            If your profile is public, we&apos;ll read your headline, About, and recent posts.
                        </p>
                    )}
                    <Button variant='secondary' onClick={submitUrl} disabled={!url.trim()} className='w-full'>
                        Continue with URL
                    </Button>
                </div>

                {linkedinError && ERROR_COPY[linkedinError] && (
                    <p className='text-muted-foreground text-xs'>{ERROR_COPY[linkedinError]}</p>
                )}
            </motion.div>
        </motion.div>
    )
}
