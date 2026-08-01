'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { withEntrySource } from '@/config/entry-sources'
import { Routes } from '@/config/routes'
import { cn } from '@/lib/utils'

import { TrackClick } from '../tracking/track-click'
import { Button } from '../ui/button'
import { MobileNav } from './mobile-nav'
import { Navbar } from './navbar'

export function Header() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <>
            {/* Gradient backdrop so page content fades out behind the navbar */}
            <div
                aria-hidden
                className='from-background via-background/85 pointer-events-none fixed inset-x-0 top-0 z-30 h-24 bg-gradient-to-b to-transparent'
            />
            <div
                className={cn(
                    'pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center transition-all duration-300 ease-[var(--ease-out)]',
                    scrolled ? 'pt-3.5' : 'pt-0',
                )}>
                <div
                    className={cn(
                        'max-w-content w-full transition-all duration-300 ease-[var(--ease-out)]',
                        scrolled ? 'px-2' : 'px-0',
                    )}>
                    <header
                        className={cn(
                            'pointer-events-auto mx-auto flex h-[var(--header-height)] w-full items-center justify-between border border-transparent px-7 transition-all duration-300 ease-[var(--ease-out)]',
                            scrolled
                                ? 'border-border/35 rounded-2xl bg-[color:color-mix(in_oklch,var(--background)_62%,transparent)] shadow-[var(--card-shadow)] backdrop-blur-[18px] backdrop-saturate-150'
                                : 'bg-transparent',
                        )}>
                        <Link href='/' aria-label='Homepage' className='flex items-center gap-2.5'>
                            <Image src='/images/logo.svg' alt='' width={26} height={26} unoptimized />
                            <span className='font-heading text-[17px] font-semibold tracking-[-0.01em]'>
                                LinkedInPreview
                            </span>
                        </Link>

                        <div className='flex items-center gap-6'>
                            <Navbar />
                            <div className='flex items-center gap-2'>
                                <Button asChild variant='ghost' size='lg' className='hidden md:flex'>
                                    <Link href={Routes.Tool}>Start writing</Link>
                                </Button>
                                <TrackClick
                                    event='cta_button_clicked'
                                    properties={{ button_name: 'create_plan', source: 'navbar' }}>
                                    <Button asChild size='lg' className='hidden md:flex'>
                                        <Link href={withEntrySource(Routes.Dashboard, 'navbar')}>
                                            Create my Linkedin plan
                                        </Link>
                                    </Button>
                                </TrackClick>
                                <MobileNav />
                            </div>
                        </div>
                    </header>
                </div>
            </div>
        </>
    )
}
