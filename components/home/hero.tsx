'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { ExternalLinks } from '@/config/urls'

import { Icons } from '../icon'
import { TrackClick } from '../tracking/track-click'
import { AnimateIn } from '../ui/animate-in'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { HeroCTA } from './hero-cta'

const AVATARS = [
    { src: '/images/avatars/user-1.jpg', fallback: 'JD' },
    { src: '/images/avatars/user-2.jpg', fallback: 'MK' },
    { src: '/images/avatars/user-3.jpg', fallback: 'AS' },
    { src: '/images/avatars/user-4.jpg', fallback: 'RL' },
]

export function Hero() {
    return (
        <section className='dot-grid'>
            <div className='mx-auto flex flex-col items-center px-6 py-20 md:pt-28'>
                {/* Announcement chip — single pill with GitHub link inside */}
                <AnimateIn delay={0}>
                    <TrackClick event='github_link_clicked' properties={{ source: 'hero' }}>
                        <Link
                            href={ExternalLinks.GitHub}
                            className='group mb-6 flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-4 pr-1 text-sm text-neutral-600 shadow-subtle transition-colors hover:border-neutral-300'>
                            <span>Forever free and open source</span>
                            <span className='flex items-center gap-1 rounded-full border border-border bg-neutral-50 px-3 py-0.5 text-sm font-medium text-neutral-800 transition-colors group-hover:bg-neutral-100'>
                                <Icons.github className='size-3.5' />
                                GitHub
                                <ArrowUpRight className='size-3' />
                            </span>
                        </Link>
                    </TrackClick>
                </AnimateIn>

                {/* Headline — bigger, bolder */}
                <AnimateIn delay={0.1}>
                    <h1 className='mb-5 text-center font-heading text-5xl font-bold tracking-[-0.02em] text-neutral-900 md:text-6xl lg:text-7xl'>
                        Format and Preview your <span className='text-primary'>LinkedIn</span> Posts
                    </h1>
                </AnimateIn>

                <AnimateIn delay={0.2}>
                    <p className='mx-auto mb-8 max-w-[540px] text-center text-lg leading-7 text-neutral-500 md:text-xl md:leading-8'>
                        A free tool to write, format, and preview your LinkedIn posts. Improve your presence and
                        engagement.
                    </p>
                </AnimateIn>

                {/* Social proof — avatar group + stars + review count */}
                <AnimateIn delay={0.3}>
                    <div className='mb-8 flex items-center gap-3 rounded-full bg-neutral-50 px-4 py-2'>
                        {/* Avatar group */}
                        <div className='flex items-center'>
                            {AVATARS.map((avatar) => (
                                <Avatar
                                    key={avatar.fallback}
                                    className='ml-[-8px] size-7 border-2 border-white first:ml-0'>
                                    <AvatarImage src={avatar.src} alt={avatar.fallback} />
                                    <AvatarFallback className='text-[10px] font-medium'>
                                        {avatar.fallback}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                        </div>

                        {/* Stars */}
                        <div className='flex gap-0.5'>
                            <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                            <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                            <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                            <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                            <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                        </div>

                        <span className='text-sm font-medium text-neutral-500'>from 3,342 reviews</span>
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
