import Link from 'next/link'
import { ArrowDown, ArrowUpRight, Github } from 'lucide-react'

import { withEntrySource } from '@/config/entry-sources'
import { Routes } from '@/config/routes'
import { ExternalLinks } from '@/config/urls'

import { Icons } from '../icon'
import { TrackClick } from '../tracking/track-click'
import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'
import { HeroPostPreview } from './hero-post-preview'
import { IllustrationTile } from './illustration-tile'

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
                                Free and open source
                                <span className='border-border bg-secondary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] font-mono text-[11px] font-medium'>
                                    <Github className='size-3' /> GitHub <ArrowUpRight className='size-2.5' />
                                </span>
                            </Link>
                        </TrackClick>
                    </AnimateIn>

                    <AnimateIn delay={0.06}>
                        {/* "LinkedIn posts" is one unbreakable unit (the logo glues it together), so the
                            floor is set by the width that unit needs: 40px overflowed a 360px Android, and
                            36px stops fitting below ~344px. text-balance keeps the free-flowing words from
                            wrapping around that unit into a one-word orphan line. */}
                        <h1 className='font-heading mb-5 text-[clamp(36px,6vw,62px)] leading-[1.02] font-bold tracking-[-0.03em] text-balance max-[350px]:text-[32px]'>
                            Format and preview your{' '}
                            <span className='inline-flex items-center gap-2 whitespace-nowrap sm:gap-2.5'>
                                <Icons.linkedinLogo
                                    aria-hidden='true'
                                    className='bg-primary inline-block size-9 shrink-0 -rotate-6 rounded-[10px] p-[7px] text-white shadow-[var(--btn-rest)] sm:size-11 sm:rounded-xl sm:p-2'
                                />
                                <span className='text-[color:var(--orange-600)]'>LinkedIn</span> posts
                            </span>
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
                                <Link href={withEntrySource(Routes.DashboardEditor(), 'hero_editor')}>
                                    Create my personalized post plan
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
                </div>

                {/* Right-hand column only. Below lg the grid collapses to one column and the
                    tile becomes a full-width wall of image that buries the editor below the fold. */}
                <AnimateIn delay={0.16} from='fade' className='relative max-lg:hidden'>
                    <IllustrationTile
                        src='/images/illustrations/coastal-cypress.jpg'
                        ratio='4 / 5'
                        eyebrow='Preview before you post'
                        title='See it the way the feed will'
                        sizes='(max-width: 1023px) 1px, 50vw'
                        priority
                    />
                    <div className='absolute -bottom-6 -left-10 drop-shadow-[0_18px_36px_oklch(0.2_0.03_222_/_0.28)]'>
                        <HeroPostPreview />
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}
