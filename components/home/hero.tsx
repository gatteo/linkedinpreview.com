import Image from 'next/image'
import Link from 'next/link'
import HeroBG from '@/public/images/bg-pattern-filled.png'

import { Routes } from '@/config/routes'
import { ExternalLinks } from '@/config/urls'

import { Icons } from '../icon'
import { TrackClick } from '../tracking/track-click'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

export function Hero() {
    return (
        <>
            <section id='hero' className='container max-w-7xl pt-16 md:pt-28 lg:pt-36'>
                <div className='flex flex-col items-center gap-8 text-center'>
                    {/* Tagline */}
                    <div className='flex items-center gap-6'>
                        <Badge>Completely Free</Badge>
                        <TrackClick event='github_link_clicked' properties={{ source: 'hero' }}>
                            <Link
                                className='inline-flex items-center space-x-1 text-sm text-muted-foreground'
                                href={ExternalLinks.GitHub}>
                                <Icons.github className='size-4' />
                                <span>View Source</span>
                            </Link>
                        </TrackClick>
                    </div>

                    {/* Headline */}
                    <div className='flex flex-col gap-4'>
                        <h1 className='text-balance font-heading text-4xl font-bold tracking-wide md:text-6xl lg:text-7xl'>
                            Format and Preview your{' '}
                            <span className='bg-gradient-to-b from-primary/60 to-primary bg-clip-text text-transparent'>
                                LinkedIn
                            </span>{' '}
                            Posts
                        </h1>
                        <p className='mx-auto max-w-2xl text-balance text-muted-foreground md:text-xl'>
                            A free tool to Write, Format, and Preview your LinkedIn posts. Improve your LinkedIn
                            presence and engagement.
                        </p>
                    </div>

                    {/* Rating */}
                    <div className='flex items-center space-x-1'>
                        <span className='pr-2 text-sm font-semibold text-muted-foreground'>4.9/5</span>
                        {Array.from({ length: 5 }).map((_, i) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <Icons.star key={i} className='mb-0.5 size-5 fill-yellow-500 text-yellow-500' />
                        ))}
                        <span className='pl-2 text-sm font-semibold text-muted-foreground'>from 3342 Reviews</span>
                    </div>

                    {/* CTA */}
                    <div className='flex gap-2'>
                        <TrackClick
                            event='cta_button_clicked'
                            properties={{ button_name: 'get_started', source: 'hero' }}>
                            <Button asChild>
                                <Link href={Routes.Tool}>Get Started</Link>
                            </Button>
                        </TrackClick>
                        <TrackClick
                            event='cta_button_clicked'
                            properties={{ button_name: 'learn_more', source: 'hero' }}>
                            <Button variant='secondary' asChild>
                                <Link href={Routes.MainFeatures}>Learn more</Link>
                            </Button>
                        </TrackClick>
                    </div>
                </div>
            </section>
            <Background />
        </>
    )
}

function Background() {
    return (
        <>
            <Image
                alt='Decorative background pattern for LinkedIn Post Preview tool'
                className='absolute inset-0 -z-10 size-full animate-pulse object-cover opacity-30'
                src={HeroBG}
                priority
            />
            <div className='absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-background/85 via-20% to-background to-80%' />
        </>
    )
}
