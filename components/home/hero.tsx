'use client'

import Link from 'next/link'

import { ExternalLinks } from '@/config/urls'

import { Icons } from '../icon'
import { TrackClick } from '../tracking/track-click'
import { AnimateIn } from '../ui/animate-in'
import { HeroCTA } from './hero-cta'

export function Hero() {
    return (
        <section className='dot-grid'>
            <div className='mx-auto flex max-w-content flex-col items-center px-6 py-20 md:pt-28'>
                {/* Announcement badge */}
                <AnimateIn delay={0}>
                    <div className='mb-6 flex items-center gap-4'>
                        <span className='inline-flex items-center rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-primary shadow-subtle'>
                            Completely Free
                        </span>
                        <TrackClick event='github_link_clicked' properties={{ source: 'hero' }}>
                            <Link
                                className='inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-subtle transition-colors hover:border-neutral-300 hover:text-neutral-900'
                                href={ExternalLinks.GitHub}>
                                <Icons.github className='size-3.5' />
                                <span>View Source</span>
                            </Link>
                        </TrackClick>
                    </div>
                </AnimateIn>

                {/* Headline */}
                <AnimateIn delay={0.1}>
                    <h1 className='mb-5 text-center font-heading text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl lg:text-6xl'>
                        Format and Preview your <span className='text-primary'>LinkedIn</span> Posts
                    </h1>
                </AnimateIn>

                <AnimateIn delay={0.2}>
                    <p className='mx-auto mb-8 max-w-[540px] text-center text-lg leading-7 text-neutral-500 md:text-xl md:leading-8'>
                        A free tool to write, format, and preview your LinkedIn posts. Improve your presence and
                        engagement.
                    </p>
                </AnimateIn>

                {/* Rating */}
                <AnimateIn delay={0.3}>
                    <div className='mb-8 flex items-center gap-1'>
                        <span className='pr-2 text-sm font-medium text-neutral-500'>4.9/5</span>
                        <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                        <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                        <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                        <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                        <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                        <span className='pl-2 text-sm font-medium text-neutral-500'>from 3,342 reviews</span>
                    </div>
                </AnimateIn>

                {/* CTA */}
                <AnimateIn delay={0.4}>
                    <HeroCTA />
                </AnimateIn>
            </div>
        </section>
    )
}
