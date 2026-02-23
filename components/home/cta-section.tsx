import Link from 'next/link'

import { Routes } from '@/config/routes'

import { Icons } from '../icon'
import { Button } from '../ui/button'

export function CtaSection() {
    return (
        <section className='relative overflow-hidden'>
            {/* Curved white-to-dark transition */}
            <div className='relative h-16 bg-background'>
                <div
                    className='absolute inset-x-0 bottom-0 h-16 bg-neutral-950'
                    style={{
                        borderTopLeftRadius: '50% 100%',
                        borderTopRightRadius: '50% 100%',
                    }}
                />
            </div>

            <div className='relative bg-neutral-950 py-20'>
                {/* Gradient accent blobs */}
                <div className='absolute left-0 top-0 size-64 rounded-full bg-primary/20 blur-[120px]' />
                <div className='absolute right-0 top-12 size-64 rounded-full bg-blue-400/10 blur-[120px]' />

                <div className='relative mx-auto max-w-content px-6 text-center'>
                    <h2 className='mb-4 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl'>
                        Supercharge your
                        <br />
                        LinkedIn presence
                    </h2>
                    <p className='mx-auto mb-8 max-w-[480px] text-lg leading-7 text-neutral-400'>
                        See why thousands of professionals use our tool to create engaging posts that stand out.
                    </p>

                    <div className='mb-10 flex items-center justify-center gap-3'>
                        <Button
                            asChild
                            className='rounded-lg bg-white px-5 py-2.5 text-neutral-900 hover:bg-neutral-100'>
                            <Link href={Routes.Tool}>Start for free</Link>
                        </Button>
                        <Button
                            asChild
                            variant='outline'
                            className='rounded-lg border-neutral-700 bg-neutral-800 px-5 py-2.5 text-white hover:bg-neutral-700 hover:text-white'>
                            <Link href={Routes.Blog}>Read our guides</Link>
                        </Button>
                    </div>

                    {/* Star ratings */}
                    <div className='flex items-center justify-center gap-2'>
                        <span className='text-sm font-medium text-neutral-400'>4.9/5</span>
                        <div className='flex gap-0.5'>
                            <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                            <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                            <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                            <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                            <Icons.star className='size-4 fill-amber-400 text-amber-400' />
                        </div>
                        <span className='text-sm text-neutral-500'>from 3,342 reviews</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
