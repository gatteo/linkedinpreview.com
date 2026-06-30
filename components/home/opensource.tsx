import Link from 'next/link'
import { ArrowUpRight, Github } from 'lucide-react'

import { ExternalLinks } from '@/config/urls'

import { TrackClick } from '../tracking/track-click'
import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'
import { Eyebrow } from './_shared'

const GH_PATH =
    'M200 52C118.3 52 52 118.3 52 200c0 65.4 42.4 120.9 101.2 140.5 7.4 1.4 10.1-3.2 10.1-7.1 0-3.5-.1-12.8-.2-25.1-41.2 9-49.9-19.8-49.9-19.8-6.7-17.1-16.4-21.7-16.4-21.7-13.4-9.2 1-9 1-9 14.9 1 22.7 15.3 22.7 15.3 13.2 22.6 34.6 16.1 43 12.3 1.3-9.6 5.2-16.1 9.4-19.8-32.9-3.7-67.5-16.4-67.5-73.2 0-16.2 5.8-29.4 15.3-39.8-1.5-3.7-6.6-18.8 1.5-39.2 0 0 12.4-4 40.8 15.2 11.8-3.3 24.5-4.9 37.1-5 12.6.1 25.3 1.7 37.1 5 28.3-19.2 40.7-15.2 40.7-15.2 8.1 20.4 3 35.5 1.5 39.2 9.5 10.4 15.2 23.6 15.2 39.8 0 57-34.7 69.4-67.7 73.1 5.3 4.6 10.1 13.6 10.1 27.5 0 19.8-.2 35.8-.2 40.7 0 3.9 2.7 8.5 10.2 7.1C305.7 320.8 348 265.4 348 200c0-81.7-66.3-148-148-148z'

function BlueprintGithub() {
    return (
        <svg viewBox='0 0 400 400' fill='none' className='h-auto w-full'>
            <circle
                cx='200'
                cy='200'
                r='160'
                stroke='currentColor'
                strokeWidth='0.75'
                strokeDasharray='6 4'
                opacity='0.25'
            />
            <circle
                cx='200'
                cy='200'
                r='120'
                stroke='currentColor'
                strokeWidth='0.5'
                strokeDasharray='3 5'
                opacity='0.15'
            />
            <line
                x1='200'
                y1='20'
                x2='200'
                y2='380'
                stroke='currentColor'
                strokeWidth='0.5'
                strokeDasharray='8 6'
                opacity='0.15'
            />
            <line
                x1='20'
                y1='200'
                x2='380'
                y2='200'
                stroke='currentColor'
                strokeWidth='0.5'
                strokeDasharray='8 6'
                opacity='0.15'
            />
            <path d={GH_PATH} stroke='currentColor' strokeWidth='1.5' opacity='0.7' />
            <path
                d={GH_PATH}
                stroke='currentColor'
                strokeWidth='0.75'
                strokeDasharray='6 3'
                opacity='0.3'
                transform='translate(2,2)'
            />
            <circle cx='200' cy='52' r='2.5' fill='currentColor' opacity='0.3' />
            <circle cx='52' cy='200' r='2.5' fill='currentColor' opacity='0.3' />
            <circle cx='348' cy='200' r='2.5' fill='currentColor' opacity='0.3' />
            <circle cx='200' cy='348' r='2.5' fill='currentColor' opacity='0.3' />
        </svg>
    )
}

export function OpenSource() {
    return (
        <section
            id='opensource'
            className='dark grain bg-background text-foreground border-border relative overflow-hidden border-t'
            style={{ '--grain-opacity': 0.4 } as React.CSSProperties}>
            <div className='dot-grid pointer-events-none absolute inset-0 opacity-35' />
            <div className='glow-warm pointer-events-none absolute -top-30 -left-30 size-[480px]' />
            <div className='max-w-content border-border relative mx-auto grid items-center border-x md:grid-cols-2'>
                <div className='px-7 py-22'>
                    <AnimateIn>
                        <Eyebrow className='mb-3.5 text-[color:var(--orange-400)]'>Open source</Eyebrow>
                        <h2 className='font-heading text-[clamp(30px,4vw,44px)] leading-[1.12] font-bold tracking-[-0.025em]'>
                            Proudly open source
                            <br />
                            <span className='text-petrol-400'>and free forever.</span>
                        </h2>
                        <p className='text-muted-foreground mt-4.5 max-w-[440px] text-base leading-relaxed'>
                            Our source code is available on GitHub - feel free to read, review, or contribute to it
                            however you want.
                        </p>
                        <div className='mt-7.5 flex flex-wrap gap-3'>
                            <TrackClick event='github_link_clicked' properties={{ source: 'opensource' }}>
                                <span className='gradient-border'>
                                    <Button asChild size='lg' className='h-11'>
                                        <Link href={ExternalLinks.GitHub}>
                                            <Github className='size-4' />
                                            Star on GitHub
                                        </Link>
                                    </Button>
                                </span>
                            </TrackClick>
                            <Button asChild variant='outline' size='lg' className='h-11'>
                                <Link href={ExternalLinks.GitHub}>
                                    View source
                                    <ArrowUpRight className='size-4' />
                                </Link>
                            </Button>
                        </div>
                    </AnimateIn>
                </div>
                <AnimateIn from='fade' delay={0.1} className='flex items-center justify-center px-7 py-10'>
                    <div className='w-full max-w-[300px] text-[color:var(--orange-500)]'>
                        <BlueprintGithub />
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}
