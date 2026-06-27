import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { SOCIAL_PROOF } from '@/config/social-proof'
import { ExternalLinks } from '@/config/urls'

import { Icons } from '../icon'
import { TrackClick } from '../tracking/track-click'
import { AnimateIn } from '../ui/animate-in'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { HeroCTA } from './hero-cta'
import { StarRating } from './star-rating'

const AVATARS = [{ fallback: 'JD' }, { fallback: 'MK' }, { fallback: 'AS' }]

export function Hero() {
    return (
        <div className='relative overflow-hidden'>
            {/* Landscape backdrop - anchored low so the full composition (foreground hill + orange tree) shows */}
            <div
                aria-hidden='true'
                className='pointer-events-none absolute inset-0 bg-cover bg-bottom bg-no-repeat'
                style={{ backgroundImage: 'url(/images/home/backgrounds/rolling-hills-wide-2.jpg)' }}
            />
            {/* Uniform white overlay to soften the image and match the other sections */}
            <div aria-hidden='true' className='pointer-events-none absolute inset-0 bg-white/30' />
            {/* Gentle fade into the next section, confined to the very bottom */}

            <div className='relative mx-auto flex flex-col items-center px-6 py-20 md:pt-28'>
                {/* Announcement chip - single pill with GitHub link inside */}
                <AnimateIn delay={0}>
                    <TrackClick event='github_link_clicked' properties={{ source: 'hero' }}>
                        <Link
                            href={ExternalLinks.GitHub}
                            className='group border-border shadow-subtle mb-6 flex items-center gap-2 rounded-full border bg-white py-1 pr-1 pl-4 text-xs text-neutral-600 transition-colors hover:border-neutral-300 sm:text-sm'>
                            <span>Forever free and open source</span>
                            <span className='border-border flex items-center gap-1 rounded-full border bg-neutral-50 px-3 py-0.5 text-sm font-medium text-neutral-800 transition-colors group-hover:bg-neutral-100'>
                                <Icons.github className='size-3.5' />
                                GitHub
                                <ArrowUpRight className='size-3' />
                            </span>
                        </Link>
                    </TrackClick>
                </AnimateIn>

                {/* Heading + subtitle on a frosted-glass card for local contrast */}
                <AnimateIn delay={0.1} className='mb-8'>
                    <div className='flex max-w-3xl flex-col items-center rounded-2xl border border-white/40 bg-white/55 px-6 py-8 shadow-lg backdrop-blur sm:px-12'>
                        <h1 className='font-heading mb-5 text-center text-5xl font-bold tracking-[-0.02em] text-balance text-neutral-900 md:text-6xl lg:text-7xl'>
                            Format and Preview your{' '}
                            <span className='text-primary inline-flex items-baseline whitespace-nowrap'>
                                <Icons.linkedinLogo
                                    aria-hidden='true'
                                    className='bg-primary mr-1 inline-block size-8 translate-y-0.5 rotate-[-6deg] self-center rounded-sm p-1 text-white md:mr-1.5 md:size-11 md:translate-y-1 md:rounded-xl md:p-1.5 lg:mr-2 lg:size-14 lg:p-2'
                                />
                                LinkedIn
                            </span>{' '}
                            Posts
                        </h1>

                        <p className='max-w-[540px] text-center text-lg leading-7 text-neutral-700 md:text-xl md:leading-8'>
                            A free tool to write, format, and preview your LinkedIn posts. Improve your Linkedin
                            presence and engagement.
                        </p>
                    </div>
                </AnimateIn>

                {/* Social proof - avatar group + stars + review count */}
                <AnimateIn delay={0.3}>
                    <div className='mb-8 flex items-center gap-1 rounded-full bg-neutral-50 px-4 py-2 sm:gap-3'>
                        {/* Avatar group */}
                        <div className='flex items-center'>
                            {AVATARS.map((avatar) => (
                                <Avatar
                                    key={avatar.fallback}
                                    className='-ml-4 size-8 border-2 border-white shadow-xs first:ml-0'>
                                    <AvatarFallback className='text-[10px] font-medium'>
                                        {avatar.fallback}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                        </div>

                        {/* Stars */}
                        <StarRating />

                        <span className='text-xs font-medium text-neutral-500 sm:text-sm'>
                            {SOCIAL_PROOF.rating}/5 from {SOCIAL_PROOF.count} reviews
                        </span>
                    </div>
                </AnimateIn>

                {/* CTA */}
                <AnimateIn delay={0.4}>
                    <HeroCTA />
                </AnimateIn>
            </div>
        </div>
    )
}
