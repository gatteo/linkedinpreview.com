import Link from 'next/link'

import { Routes } from '@/config/routes'
import { Button } from '@/components/ui/button'

export function Hero() {
    return (
        <section className='dot-grid'>
            <div className='max-w-content mx-auto flex flex-col items-center px-6 pt-20 pb-16 md:pt-28'>
                <p className='tracking-label mb-4 font-mono text-xs font-medium text-[color:var(--orange-600)] uppercase'>
                    Blog & Guides
                </p>
                <h1 className='font-heading text-foreground mb-5 text-center text-4xl font-bold tracking-tight md:text-5xl'>
                    Tips & guides to write great <span className='text-primary'>LinkedIn</span> posts
                </h1>
                <p className='text-muted-foreground mx-auto mb-8 max-w-[540px] text-center text-lg leading-7'>
                    Useful tips and guides to write better LinkedIn posts, get more engagement, and grow your audience.
                </p>
                <Button asChild className='rounded-lg'>
                    <Link href={Routes.Tool}>Get Started with Our Free Tool</Link>
                </Button>
            </div>
        </section>
    )
}
