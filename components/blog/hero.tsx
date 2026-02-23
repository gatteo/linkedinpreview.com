import Link from 'next/link'

import { Routes } from '@/config/routes'

import { Button } from '../ui/button'

export function Hero() {
    return (
        <section className='dot-grid'>
            <div className='mx-auto flex max-w-content flex-col items-center px-6 pb-16 pt-20 md:pt-28'>
                <span className='mb-4 inline-flex items-center rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-primary shadow-subtle'>
                    Blog & Guides
                </span>
                <h1 className='mb-5 text-center font-heading text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl'>
                    Tips & guides to write great <span className='text-primary'>LinkedIn</span> posts
                </h1>
                <p className='mx-auto mb-8 max-w-[540px] text-center text-lg leading-7 text-neutral-500'>
                    Useful tips and guides to write better LinkedIn posts, get more engagement, and grow your audience.
                </p>
                <Button asChild className='rounded-lg'>
                    <Link href={Routes.Tool}>Get Started with Our Free Tool</Link>
                </Button>
            </div>
        </section>
    )
}
