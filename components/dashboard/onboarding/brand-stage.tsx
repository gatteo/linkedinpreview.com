'use client'

import Image from 'next/image'
import LogoImage from '@/public/images/logo-rounded-rectangle.png'
import { AnimatePresence, motion } from 'framer-motion'

import { EASE_OUT } from '@/lib/motion'
import { cn } from '@/lib/utils'

import type { StepId } from './types'

// ---------------------------------------------------------------------------
// Brand Stage - the immersive left panel of the split-screen onboarding.
//
// Each step gets a full-bleed illustration (from public/images/illustrations),
// a mono eyebrow, and a display caption. The image + caption crossfade as the
// flow advances. Setup-progress ticks sit under the logo. Design import:
// onboarding/index.html (app.jsx · STAGE).
// ---------------------------------------------------------------------------

type Stage = { img: string; eyebrow: string; title: string; sub: string; focus: string }

const STAGE: Record<StepId, Stage> = {
    welcome: {
        img: 'valley-fog.jpg',
        eyebrow: 'Welcome',
        title: 'Stand out.\nBe the orange tree.',
        sub: 'Two minutes to a LinkedIn that finally works for you.',
        focus: '50% 60%',
    },
    connect: {
        img: 'lighthouse.jpg',
        eyebrow: 'Connect',
        title: 'Make it\nunmistakably yours.',
        sub: 'Import your name and photo, or paste your profile to go deeper.',
        focus: '60% 50%',
    },
    mirror: {
        img: 'coastal-cypress.jpg',
        eyebrow: 'First look',
        title: 'A starting point,\nshaped to you.',
        sub: 'Your niche, voice, and audience - ready for you to fine-tune.',
        focus: '40% 50%',
    },
    goal: {
        img: 'rolling-hills-wide.jpg',
        eyebrow: 'Your goal',
        title: 'Know exactly\nwhere this goes.',
        sub: 'One clear destination shapes everything we make.',
        focus: '60% 55%',
    },
    proof: {
        img: 'night-landscape.jpg',
        eyebrow: 'Why this works',
        title: 'Consistency\ncompounds.',
        sub: 'The hard part is showing up. That is exactly what this makes easy.',
        focus: '50% 45%',
    },
    preview: {
        img: 'sailboat.jpg',
        eyebrow: 'The aha',
        title: 'Your first post,\nready to go.',
        sub: 'A post built around your goal and niche, in seconds.',
        focus: '55% 50%',
    },
    voice: {
        img: 'calm-hills-1.jpg',
        eyebrow: 'Your voice',
        title: 'A voice no one\nelse can copy.',
        sub: 'Tune how every post should read.',
        focus: '50% 55%',
    },
    spotlight: {
        img: 'rolling-hills-wide-2.jpg',
        eyebrow: 'Built for you',
        title: 'Built for how\nyou actually grow.',
        sub: 'The one feature that moves your needle.',
        focus: '60% 55%',
    },
    cadence: {
        img: 'calm-hills-2.jpg',
        eyebrow: 'Cadence',
        title: 'Show up\non a rhythm.',
        sub: 'Pick a pace you can actually keep.',
        focus: '55% 55%',
    },
    building: {
        img: 'hot-air-balloon.jpg',
        eyebrow: 'Building',
        title: 'Assembling\nyour system.',
        sub: 'Positioning, formats, and your calendar.',
        focus: '45% 50%',
    },
    recap: {
        img: 'tuscan-hills.jpg',
        eyebrow: 'Ready',
        title: "It's all\nyours now.",
        sub: 'Everything you set up, in one place.',
        focus: '50% 60%',
    },
    offer: {
        img: 'night-landscape.jpg',
        eyebrow: 'The offer',
        title: 'Keep the system\nyou just built.',
        sub: 'Less than a coffee a month.',
        focus: '50% 45%',
    },
    done: {
        img: 'hot-air-balloon.jpg',
        eyebrow: 'Done',
        title: 'Go make\nsome noise.',
        sub: 'Your first post is ready and waiting.',
        focus: '45% 50%',
    },
}

export function BrandStage({ step, dataDone, total }: { step: StepId; dataDone: number; total: number }) {
    const s = STAGE[step] ?? STAGE.welcome

    return (
        <div className='bg-petrol-900 relative w-[clamp(320px,40%,520px)] shrink-0 overflow-hidden max-md:h-[168px] max-md:w-full'>
            {/* Crossfading illustration */}
            <AnimatePresence initial={false}>
                <motion.div
                    key={s.img}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: EASE_OUT }}
                    className='absolute inset-0'>
                    <Image
                        src={`/images/illustrations/${s.img}`}
                        alt=''
                        fill
                        sizes='(max-width: 768px) 100vw, 520px'
                        className='object-cover'
                        style={{ objectPosition: s.focus }}
                        priority
                    />
                </motion.div>
            </AnimatePresence>

            {/* Scrims + film grain */}
            <div
                className='absolute inset-0'
                style={{
                    background:
                        'linear-gradient(180deg, oklch(0.16 0.03 222 / 0.35) 0%, transparent 26%, transparent 42%, oklch(0.14 0.03 222 / 0.78) 100%)',
                }}
            />
            <span
                className='grain'
                style={{ 'position': 'absolute', 'inset': 0, '--grain-opacity': 0.22 } as React.CSSProperties}
            />

            {/* Top: logo + setup ticks */}
            <div className='absolute inset-x-0 top-0 flex items-center justify-between p-[clamp(20px,3vw,32px)]'>
                <span className='inline-flex items-center gap-2.5'>
                    <Image src={LogoImage} alt='' width={28} height={28} className='rounded-lg' placeholder='blur' />
                    <span className='text-[15px] font-semibold tracking-tight text-[oklch(0.98_0.01_90)]'>
                        LinkedInPreview
                    </span>
                </span>
                <div className='flex gap-1.5 max-md:hidden'>
                    {Array.from({ length: total }).map((_, i) => (
                        <span
                            key={i}
                            className={cn(
                                'h-[5px] rounded-full transition-all duration-300',
                                i < dataDone ? 'bg-primary w-[22px]' : 'w-4 bg-[oklch(1_0_0_/_0.32)]',
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom: editorial caption */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: EASE_OUT }}
                    className='absolute inset-x-0 bottom-0 p-[clamp(24px,3.2vw,44px)] text-[oklch(0.98_0.01_90)] max-md:p-5'>
                    <div className='tracking-label mb-3.5 font-mono text-[11.5px] font-semibold text-orange-200 uppercase max-md:mb-2'>
                        {s.eyebrow}
                    </div>
                    <h2 className='font-heading m-0 text-[clamp(30px,3.4vw,46px)] leading-[1.04] font-bold tracking-[-0.03em] whitespace-pre-line [text-shadow:0_1px_24px_oklch(0.14_0.03_222_/_0.5)] max-md:text-2xl'>
                        {s.title}
                    </h2>
                    <p className='mt-3.5 max-w-[360px] text-[14.5px] leading-normal text-[oklch(0.95_0.01_200_/_0.82)] max-md:hidden'>
                        {s.sub}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
