import Image from 'next/image'
import Link from 'next/link'
import HeroBG from '@/public/images/bg-pattern-filled.png'

import { Routes } from '@/config/routes'

import { Button } from '../ui/button'

export function Hero() {
    return (
        <>
            <section id='hero' className='container max-w-7xl pt-16 md:pt-28'>
                <div className='flex flex-col items-center gap-8 text-center'>
                    <div className='flex flex-col gap-4'>
                        <h1 className='text-balance font-heading text-4xl font-bold tracking-wide md:text-6xl lg:text-7xl'>
                            Tips & Guides to Write Great{' '}
                            <span className='bg-gradient-to-b from-primary/60 to-primary bg-clip-text text-transparent'>
                                LinkedIn
                            </span>{' '}
                            Posts
                        </h1>
                        <p className='mx-auto max-w-2xl text-balance text-muted-foreground md:text-xl'>
                            Useful Tips and Guides to write better LinkedIn posts, get more engagement, and grow your
                            audience.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href={Routes.Tool}>Get Started with Our Free Tool</Link>
                    </Button>
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
                alt='Background'
                className='absolute inset-0 -z-10 size-full animate-pulse object-cover opacity-30'
                src={HeroBG}
            />
            <div className='absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-background/85 via-20% to-background to-80%' />
        </>
    )
}
