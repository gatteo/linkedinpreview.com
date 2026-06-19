'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { GlobeIcon, MessageSquareIcon, RepeatIcon, ThumbsUpIcon, UploadIcon } from 'lucide-react'

import { fadeUp } from '@/lib/motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { OnboardingAnswers } from '../types'

type ProfileStepProps = {
    answers: OnboardingAnswers
    update: (patch: Partial<OnboardingAnswers>) => void
}

export function ProfileStep({ answers, update }: ProfileStepProps) {
    const { profile } = answers
    const fileRef = React.useRef<HTMLInputElement>(null)

    const setProfile = (patch: Partial<OnboardingAnswers['profile']>) => update({ profile: { ...profile, ...patch } })

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => setProfile({ avatarUrl: String(reader.result) })
        reader.readAsDataURL(file)
    }

    return (
        <div className='grid gap-6 sm:grid-cols-2 sm:items-start'>
            {/* Form */}
            <div className='flex flex-col gap-4'>
                <div className='flex items-center gap-3'>
                    <Avatar className='size-14'>
                        <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                        <AvatarFallback>{profile.name.slice(0, 1).toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <Button variant='outline' size='sm' onClick={() => fileRef.current?.click()}>
                        <UploadIcon className='size-3.5' />
                        {profile.avatarUrl ? 'Change photo' : 'Add photo'}
                    </Button>
                    <input ref={fileRef} type='file' accept='image/*' onChange={handleUpload} className='hidden' />
                </div>
                <div className='flex flex-col gap-1.5'>
                    <Label htmlFor='ob-name'>Full name</Label>
                    <Input
                        id='ob-name'
                        value={profile.name}
                        onChange={(e) => setProfile({ name: e.target.value })}
                        placeholder='Jane Doe'
                    />
                </div>
                <div className='flex flex-col gap-1.5'>
                    <Label htmlFor='ob-headline'>Headline</Label>
                    <Input
                        id='ob-headline'
                        value={profile.headline}
                        onChange={(e) => setProfile({ headline: e.target.value })}
                        placeholder='Founder @ Acme · Helping teams ship faster'
                    />
                    <p className='text-muted-foreground text-xs'>The one-liner under your name on LinkedIn.</p>
                </div>
            </div>

            {/* Live preview */}
            <motion.div variants={fadeUp} initial='hidden' animate='visible' className='sm:pt-1'>
                <p className='text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase'>Live preview</p>
                <div className='bg-card rounded-xl border p-3.5 shadow-[var(--shadow-subtle)]'>
                    <div className='flex items-center gap-2.5'>
                        <Avatar className='size-11'>
                            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                            <AvatarFallback>{profile.name.slice(0, 1).toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                        <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-semibold'>{profile.name || 'Your name'}</p>
                            <p className='text-muted-foreground truncate text-xs'>
                                {profile.headline || 'Your headline appears here'}
                            </p>
                            <p className='text-muted-foreground flex items-center gap-1 text-[11px]'>
                                Now · <GlobeIcon className='size-3' />
                            </p>
                        </div>
                        <span className='text-primary text-xs font-semibold'>+ Follow</span>
                    </div>
                    <div className='mt-3 space-y-1.5'>
                        <div className='bg-muted h-2 w-full rounded-full' />
                        <div className='bg-muted h-2 w-4/5 rounded-full' />
                        <div className='bg-muted h-2 w-2/3 rounded-full' />
                    </div>
                    <div className='text-muted-foreground mt-3 flex items-center justify-between border-t pt-2 text-[11px]'>
                        <span className='flex items-center gap-1'>
                            <ThumbsUpIcon className='size-3.5' /> Like
                        </span>
                        <span className='flex items-center gap-1'>
                            <MessageSquareIcon className='size-3.5' /> Comment
                        </span>
                        <span className='flex items-center gap-1'>
                            <RepeatIcon className='size-3.5' /> Repost
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
