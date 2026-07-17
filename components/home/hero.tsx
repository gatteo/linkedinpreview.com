import Link from 'next/link'
import { ArrowDown, ArrowUpRight, Github } from 'lucide-react'

import { Routes } from '@/config/routes'
import { SOCIAL_PROOF } from '@/config/social-proof'
import { ExternalLinks } from '@/config/urls'

import { Icons } from '../icon'
import { TrackClick } from '../tracking/track-click'
import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'
import { HeroPostPreview } from './hero-post-preview'
import { IllustrationTile } from './illustration-tile'
import { StarRating } from './star-rating'

export function Hero() {
    return (
        <section className='relative overflow-hidden'>
            <div className='dot-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,#000_180px)] opacity-50' />
            <div className='max-w-content relative mx-auto grid grid-cols-1 items-center gap-14 px-7 pt-8 pb-16 lg:grid-cols-[1.05fr_0.95fr]'>
                <div>
                    <AnimateIn delay={0}>
                        <TrackClick event='github_link_clicked' properties={{ source: 'hero' }}>
                            <Link
                                href={ExternalLinks.GitHub}
                                className='border-border shadow-subtle text-petrol-700 dark:text-petrol-100 bg-card mb-6 inline-flex items-center gap-2 rounded-full border py-[5px] pr-[5px] pl-3.5 text-[13px]'>
                                <span className='bg-primary inline-flex size-[7px] rounded-full' />
                                Forever free and open source
                                <span className='border-border bg-secondary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] font-mono text-[11px] font-medium'>
                                    <Github className='size-3' /> GitHub <ArrowUpRight className='size-2.5' />
                                </span>
                            </Link>
                        </TrackClick>
                    </AnimateIn>

                    <AnimateIn delay={0.06}>
                        <h1 className='font-heading mb-5 text-[clamp(40px,6vw,62px)] leading-[1.02] font-bold tracking-[-0.03em]'>
                            Format and preview your{' '}
                            <span className='inline-flex items-center gap-2.5 whitespace-nowrap text-[color:var(--orange-600)]'>
                                <Icons.linkedinLogo
                                    aria-hidden='true'
                                    className='bg-primary inline-block size-11 shrink-0 -rotate-6 rounded-xl p-2 text-white shadow-[var(--btn-rest)]'
                                />
                                LinkedIn
                            </span>{' '}
                            posts
                        </h1>
                    </AnimateIn>

                    <AnimateIn delay={0.12}>
                        <p className='text-muted-foreground mb-7 max-w-[480px] text-[19px] leading-[1.55]'>
                            A free tool to write, format, and preview your LinkedIn posts before you publish - improve
                            your presence and engagement. No signup, no paywall.
                        </p>
                    </AnimateIn>

                    <AnimateIn delay={0.18}>
                        <div className='mb-4 flex flex-wrap items-center gap-3'>
                            <span className='gradient-border'>
                                <Button asChild size='lg' className='h-12 px-[22px] text-[15px]'>
                                    <Link href={Routes.Tool}>
                                        Start writing, scroll down
                                        <ArrowDown className='size-4' />
                                    </Link>
                                </Button>
                            </span>
                            <Button asChild variant='outline' size='lg' className='h-12 px-5 text-[15px]'>
                                <Link href={Routes.DashboardEditor()}>
                                    Open the full editor
                                    <ArrowUpRight className='size-4' />
                                </Link>
                            </Button>
                        </div>
                        <div className='text-muted-foreground mb-7 flex items-center gap-2 font-mono text-xs tracking-[0.02em]'>
                            <span>Free</span>
                            <span className='opacity-45'>·</span>
                            <span>No signup</span>
                            <span className='opacity-45'>·</span>
                            <span>Open source</span>
                        </div>
                    </AnimateIn>

                    <AnimateIn delay={0.24}>
                        <div className='inline-flex items-center gap-2.5'>
                            <StarRating />
                            <div className='text-muted-foreground text-[13px]'>
                                <b className='text-foreground'>{SOCIAL_PROOF.rating}</b> from {SOCIAL_PROOF.count}{' '}
                                reviews
                            </div>
                        </div>
                    </AnimateIn>
                </div>

                <AnimateIn delay={0.16} from='fade' className='relative'>
                    <IllustrationTile
                        src='/images/illustrations/coastal-cypress.jpg'
                        ratio='4 / 5'
                        eyebrow='Preview before you post'
                        title='See it the way the feed will'
                        priority
                    />
                    <div className='absolute -bottom-6 -left-10 hidden drop-shadow-[0_18px_36px_oklch(0.2_0.03_222_/_0.28)] sm:block'>
                        <HeroPostPreview />
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}
