import Link from 'next/link'

import { Routes } from '@/config/routes'
import { SOCIAL_PROOF } from '@/config/social-proof'

import { Button } from '../ui/button'
import { StarRating } from './star-rating'

function BlueprintGrid() {
    return (
        <div className='pointer-events-none absolute inset-0 overflow-hidden'>
            <div
                className='absolute inset-0'
                style={{
                    backgroundImage: [
                        'linear-gradient(to right, rgba(255,255,255,0.04) 0.5px, transparent 0.5px)',
                        'linear-gradient(to bottom, rgba(255,255,255,0.04) 0.5px, transparent 0.5px)',
                    ].join(', '),
                    backgroundSize: '80px 80px',
                }}
            />

            {/* Dashed horizontal construction lines */}
            <div
                className='absolute top-1/4 right-0 left-0'
                style={{
                    height: '1px',
                    backgroundImage:
                        'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 4px, transparent 4px 12px)',
                }}
            />
            <div
                className='absolute top-3/4 right-0 left-0'
                style={{
                    height: '1px',
                    backgroundImage:
                        'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 4px, transparent 4px 12px)',
                }}
            />

            {/* Dashed vertical construction lines */}
            <div
                className='absolute top-0 bottom-0 left-1/4'
                style={{
                    width: '1px',
                    backgroundImage:
                        'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 4px, transparent 4px 12px)',
                }}
            />
            <div
                className='absolute top-0 right-1/4 bottom-0'
                style={{
                    width: '1px',
                    backgroundImage:
                        'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 4px, transparent 4px 12px)',
                }}
            />

            {/* Corner annotation dots */}
            <div className='absolute top-1/4 left-1/4 size-1.5 -translate-1/2 rounded-full bg-white/10' />
            <div className='absolute top-1/4 right-1/4 size-1.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10' />
            <div className='absolute bottom-1/4 left-1/4 size-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/10' />
            <div className='absolute right-1/4 bottom-1/4 size-1.5 translate-1/2 rounded-full bg-white/10' />
        </div>
    )
}

export function CtaSection() {
    return (
        <section className='relative overflow-hidden'>
            <div className='bg-background relative h-16'>
                <div className='absolute inset-x-0 bottom-0 h-16 bg-neutral-950' />
            </div>

            <div className='relative bg-neutral-950 py-20'>
                <BlueprintGrid />

                {/* Gradient accent blobs */}
                <div className='bg-primary/20 absolute top-0 left-0 size-64 rounded-full blur-[120px]' />
                <div className='absolute top-12 right-0 size-64 rounded-full bg-blue-400/10 blur-[120px]' />

                <div className='max-w-content relative mx-auto px-6 text-center'>
                    <h2 className='font-heading mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl'>
                        Supercharge your
                        <br />
                        LinkedIn presence
                    </h2>
                    <p className='mx-auto mb-8 max-w-[480px] text-base leading-7 text-neutral-400'>
                        See why thousands of professionals use our tool to create engaging posts that stand out.
                    </p>

                    <div className='mb-10 flex items-center justify-center gap-3'>
                        <Button
                            asChild
                            className='rounded-lg bg-white px-5 py-2.5 text-neutral-900 hover:bg-neutral-100'>
                            <Link href={Routes.Tool}>Start, it's free</Link>
                        </Button>
                        <Button
                            asChild
                            variant='outline'
                            className='rounded-lg border-neutral-700 bg-neutral-800 px-5 py-2.5 text-white hover:bg-neutral-700 hover:text-white'>
                            <Link href={Routes.Blog}>Read our guides</Link>
                        </Button>
                    </div>

                    <div className='flex items-center justify-center gap-2'>
                        <span className='text-sm font-medium text-neutral-400'>{SOCIAL_PROOF.rating}/5</span>
                        <StarRating />
                        <span className='text-sm text-neutral-500'>from {SOCIAL_PROOF.count} reviews</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
