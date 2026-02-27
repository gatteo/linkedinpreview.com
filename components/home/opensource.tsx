import Link from 'next/link'

import { ExternalLinks } from '@/config/urls'

import { TrackClick } from '../tracking/track-click'
import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'

function BlueprintGithub() {
    return (
        <svg viewBox='0 0 400 400' fill='none' xmlns='http://www.w3.org/2000/svg' className='size-full'>
            {/* Construction circles (dashed) */}
            <circle
                cx='200'
                cy='200'
                r='160'
                stroke='currentColor'
                strokeWidth='0.75'
                strokeDasharray='6 4'
                opacity='0.2'
            />
            <circle
                cx='200'
                cy='200'
                r='120'
                stroke='currentColor'
                strokeWidth='0.5'
                strokeDasharray='3 5'
                opacity='0.12'
            />

            {/* Crosshair lines */}
            <line
                x1='200'
                y1='20'
                x2='200'
                y2='380'
                stroke='currentColor'
                strokeWidth='0.5'
                strokeDasharray='8 6'
                opacity='0.12'
            />
            <line
                x1='20'
                y1='200'
                x2='380'
                y2='200'
                stroke='currentColor'
                strokeWidth='0.5'
                strokeDasharray='8 6'
                opacity='0.12'
            />

            {/* GitHub logo */}
            <path
                d='M200 52C118.3 52 52 118.3 52 200c0 65.4 42.4 120.9 101.2 140.5 7.4 1.4 10.1-3.2 10.1-7.1 0-3.5-.1-12.8-.2-25.1-41.2 9-49.9-19.8-49.9-19.8-6.7-17.1-16.4-21.7-16.4-21.7-13.4-9.2 1-9 1-9 14.9 1 22.7 15.3 22.7 15.3 13.2 22.6 34.6 16.1 43 12.3 1.3-9.6 5.2-16.1 9.4-19.8-32.9-3.7-67.5-16.4-67.5-73.2 0-16.2 5.8-29.4 15.3-39.8-1.5-3.7-6.6-18.8 1.5-39.2 0 0 12.4-4 40.8 15.2 11.8-3.3 24.5-4.9 37.1-5 12.6.1 25.3 1.7 37.1 5 28.3-19.2 40.7-15.2 40.7-15.2 8.1 20.4 3 35.5 1.5 39.2 9.5 10.4 15.2 23.6 15.2 39.8 0 57-34.7 69.4-67.7 73.1 5.3 4.6 10.1 13.6 10.1 27.5 0 19.8-.2 35.8-.2 40.7 0 3.9 2.7 8.5 10.2 7.1C305.7 320.8 348 265.4 348 200c0-81.7-66.3-148-148-148z'
                stroke='currentColor'
                strokeWidth='1.5'
                opacity='0.55'
            />

            {/* Offset stroke for blueprint depth */}
            <path
                d='M200 52C118.3 52 52 118.3 52 200c0 65.4 42.4 120.9 101.2 140.5 7.4 1.4 10.1-3.2 10.1-7.1 0-3.5-.1-12.8-.2-25.1-41.2 9-49.9-19.8-49.9-19.8-6.7-17.1-16.4-21.7-16.4-21.7-13.4-9.2 1-9 1-9 14.9 1 22.7 15.3 22.7 15.3 13.2 22.6 34.6 16.1 43 12.3 1.3-9.6 5.2-16.1 9.4-19.8-32.9-3.7-67.5-16.4-67.5-73.2 0-16.2 5.8-29.4 15.3-39.8-1.5-3.7-6.6-18.8 1.5-39.2 0 0 12.4-4 40.8 15.2 11.8-3.3 24.5-4.9 37.1-5 12.6.1 25.3 1.7 37.1 5 28.3-19.2 40.7-15.2 40.7-15.2 8.1 20.4 3 35.5 1.5 39.2 9.5 10.4 15.2 23.6 15.2 39.8 0 57-34.7 69.4-67.7 73.1 5.3 4.6 10.1 13.6 10.1 27.5 0 19.8-.2 35.8-.2 40.7 0 3.9 2.7 8.5 10.2 7.1C305.7 320.8 348 265.4 348 200c0-81.7-66.3-148-148-148z'
                stroke='currentColor'
                strokeWidth='0.75'
                strokeDasharray='6 3'
                opacity='0.25'
                transform='translate(2, 2)'
            />

            {/* Dimension tick marks */}

            {/* Annotation dots */}
            <circle cx='200' cy='52' r='2.5' fill='currentColor' opacity='0.2' />
            <circle cx='52' cy='200' r='2.5' fill='currentColor' opacity='0.2' />
            <circle cx='348' cy='200' r='2.5' fill='currentColor' opacity='0.2' />
            <circle cx='200' cy='348' r='2.5' fill='currentColor' opacity='0.2' />

            {/* Hatching fill */}
            <clipPath id='gh-clip'>
                <path d='M200 52C118.3 52 52 118.3 52 200c0 65.4 42.4 120.9 101.2 140.5 7.4 1.4 10.1-3.2 10.1-7.1 0-3.5-.1-12.8-.2-25.1-41.2 9-49.9-19.8-49.9-19.8-6.7-17.1-16.4-21.7-16.4-21.7-13.4-9.2 1-9 1-9 14.9 1 22.7 15.3 22.7 15.3 13.2 22.6 34.6 16.1 43 12.3 1.3-9.6 5.2-16.1 9.4-19.8-32.9-3.7-67.5-16.4-67.5-73.2 0-16.2 5.8-29.4 15.3-39.8-1.5-3.7-6.6-18.8 1.5-39.2 0 0 12.4-4 40.8 15.2 11.8-3.3 24.5-4.9 37.1-5 12.6.1 25.3 1.7 37.1 5 28.3-19.2 40.7-15.2 40.7-15.2 8.1 20.4 3 35.5 1.5 39.2 9.5 10.4 15.2 23.6 15.2 39.8 0 57-34.7 69.4-67.7 73.1 5.3 4.6 10.1 13.6 10.1 27.5 0 19.8-.2 35.8-.2 40.7 0 3.9 2.7 8.5 10.2 7.1C305.7 320.8 348 265.4 348 200c0-81.7-66.3-148-148-148z' />
            </clipPath>
            <g clipPath='url(#gh-clip)' opacity='0.06'>
                {Array.from({ length: 20 }).map((_, idx) => {
                    const x = 40 + idx * 18
                    return <line key={x} x1={x} y1='40' x2={x - 100} y2='380' stroke='currentColor' strokeWidth='1' />
                })}
            </g>
        </svg>
    )
}

export function OpenSource() {
    return (
        <section id='opensource'>
            <AnimateIn>
                <div className='relative overflow-hidden bg-neutral-950'>
                    {/* Full-bleed decorations */}
                    <div
                        className='pointer-events-none absolute inset-0'
                        style={{
                            backgroundImage: [
                                'linear-gradient(to right, rgba(255,255,255,0.04) 0.5px, transparent 0.5px)',
                                'linear-gradient(to bottom, rgba(255,255,255,0.04) 0.5px, transparent 0.5px)',
                            ].join(', '),
                            backgroundSize: '80px 80px',
                        }}
                    />
                    <div className='bg-primary/15 absolute top-0 left-0 size-64 rounded-full blur-[120px]' />
                    <div className='absolute right-0 bottom-0 size-64 rounded-full bg-blue-400/10 blur-[120px]' />

                    {/* Content constrained to match other sections */}
                    <div className='max-w-content relative mx-auto grid items-center md:grid-cols-2'>
                        <div
                            className='pointer-events-none absolute top-0 bottom-0 left-1/2 hidden md:block'
                            style={{
                                width: '1px',
                                backgroundImage:
                                    'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 4px, transparent 4px 10px)',
                            }}
                        />

                        {/* Left: Copy + CTAs */}
                        <div className='relative z-10 px-6 py-16 md:py-24 lg:py-28'>
                            <p className='text-primary mb-2 text-sm font-semibold tracking-wider uppercase'>
                                Open Source
                            </p>
                            <h2 className='font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-[1.15]'>
                                Proudly open source
                                <br />
                                <span className='text-neutral-500'>And free forever.</span>
                            </h2>
                            <p className='mt-4 max-w-md text-base leading-relaxed text-neutral-400'>
                                Our source code is available on GitHub - feel free to read, review, or contribute to it
                                however you want.
                            </p>
                            <div className='mt-8 flex flex-wrap gap-3'>
                                <TrackClick event='github_link_clicked' properties={{ source: 'opensource_section' }}>
                                    <Button
                                        asChild
                                        size='lg'
                                        className='bg-white text-neutral-900 hover:bg-neutral-100'>
                                        <Link href={ExternalLinks.GitHub} target='_blank' rel='noopener noreferrer'>
                                            Star on GitHub
                                        </Link>
                                    </Button>
                                </TrackClick>
                                <TrackClick event='github_source_clicked' properties={{ source: 'opensource_section' }}>
                                    <Button
                                        asChild
                                        variant='outline'
                                        size='lg'
                                        className='border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700 hover:text-white'>
                                        <Link href={ExternalLinks.GitHub} target='_blank' rel='noopener noreferrer'>
                                            View Source
                                        </Link>
                                    </Button>
                                </TrackClick>
                            </div>
                        </div>

                        {/* Right: Blueprint GitHub illustration */}
                        <div className='relative z-10 flex items-center justify-center px-6 py-12 text-white md:py-24'>
                            <div className='w-full max-w-[320px]'>
                                <BlueprintGithub />
                            </div>
                        </div>
                    </div>
                </div>
            </AnimateIn>
        </section>
    )
}
