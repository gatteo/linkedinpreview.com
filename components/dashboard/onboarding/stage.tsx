'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'

import { EASE_OUT } from '@/lib/motion'

// ---------------------------------------------------------------------------
// Stage - the immersive illustration panel of the split-layout onboarding
// (design import: onboarding/flow/ui.jsx · Stage). Pure imagery: a full-bleed
// illustration, a top+bottom scrim, and film grain. Crossfades as the flow
// advances. The hero variant is the full-card background of the welcome step.
// ---------------------------------------------------------------------------

export type StageArt = { img: string; focus: string }

export function Stage({ stage }: { stage: StageArt }) {
    return (
        <div className='bg-petrol-900 relative w-[43%] min-w-[380px] shrink-0 overflow-hidden max-md:hidden'>
            <AnimatePresence initial={false}>
                <motion.div
                    key={stage.img}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: EASE_OUT }}
                    className='absolute inset-0'>
                    <Image
                        src={`/images/illustrations/${stage.img}`}
                        alt=''
                        fill
                        sizes='1200px'
                        className='object-cover'
                        style={{ objectPosition: stage.focus }}
                        priority
                    />
                </motion.div>
            </AnimatePresence>
            <div
                className='absolute inset-0'
                style={{
                    background:
                        'linear-gradient(180deg, oklch(0.16 0.03 222 / 0.42) 0%, transparent 32%, transparent 44%, oklch(0.12 0.03 222 / 0.9) 100%)',
                }}
            />
            <span
                className='grain'
                style={{ 'position': 'absolute', 'inset': 0, '--grain-opacity': 0.22 } as React.CSSProperties}
            />
        </div>
    )
}

export function HeroStage({ stage }: { stage: StageArt }) {
    return (
        <>
            <div className='absolute inset-0'>
                <Image
                    src={`/images/illustrations/${stage.img}`}
                    alt=''
                    fill
                    sizes='1160px'
                    className='object-cover'
                    style={{ objectPosition: stage.focus }}
                    priority
                />
            </div>
            <div
                className='absolute inset-0'
                style={{
                    background:
                        'linear-gradient(180deg, oklch(0.14 0.03 222 / 0.62) 0%, oklch(0.14 0.03 222 / 0.42) 42%, oklch(0.1 0.03 222 / 0.96) 100%)',
                }}
            />
            <span
                className='grain'
                style={{ 'position': 'absolute', 'inset': 0, '--grain-opacity': 0.2 } as React.CSSProperties}
            />
        </>
    )
}
