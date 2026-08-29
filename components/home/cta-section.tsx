import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Routes } from '@/config/routes'

import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'

export function CtaSection() {
    return (
        <section className='relative'>
            <div className='max-w-content border-border mx-auto border-x px-7 py-7'>
                <AnimateIn>
                    <div className='relative overflow-hidden rounded-xl shadow-[var(--shadow-hero)]'>
                        <Image
                            src='/images/illustrations/night-landscape.jpg'
                            alt=''
                            fill
                            sizes='(max-width: 1200px) 100vw, 1200px'
                            className='object-cover'
                        />
                        <span className='absolute inset-0 bg-gradient-to-t from-[oklch(0.16_0.03_222_/_0.92)] to-[oklch(0.16_0.03_222_/_0.6)]' />
                        <span
                            className='grain absolute inset-0'
                            style={{ '--grain-opacity': 0.3 } as React.CSSProperties}
                        />
                        <div className='relative px-7 py-19 text-center text-[oklch(0.98_0.01_90)]'>
                            <p className='tracking-label mb-3.5 font-mono text-xs font-medium text-[color:var(--orange-200)] uppercase'>
                                Your next post is one line away
                            </p>
                            <h2 className='font-heading mx-auto mb-4 max-w-[640px] text-[clamp(32px,4.6vw,48px)] leading-[1.04] font-bold tracking-[-0.03em]'>
                                Write your next LinkedIn post.
                            </h2>
                            <p className='mx-auto mb-7 max-w-[480px] text-[17px] leading-[1.55] text-[oklch(0.92_0.01_200_/_0.85)]'>
                                Use the free editor to format your text and preview it before you publish. No account
                                needed.
                            </p>
                            <div className='inline-flex flex-wrap justify-center gap-3'>
                                <span className='gradient-border'>
                                    <Button asChild size='lg' className='h-[50px] px-6.5 text-base'>
                                        <Link href={Routes.Tool}>
                                            Start writing
                                            <ArrowRight className='size-4' />
                                        </Link>
                                    </Button>
                                </span>
                                <Button
                                    asChild
                                    variant='outline'
                                    size='lg'
                                    className='h-[50px] border-white/25 bg-white/10 px-6 text-base text-[oklch(0.98_0.01_90)] hover:bg-white/20 hover:text-white'>
                                    <Link href={Routes.Blog}>Read our guides</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}
