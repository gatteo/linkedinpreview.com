'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import LogoImage from '@/public/images/logo-rounded-rectangle.png'
import { ArrowRight } from 'lucide-react'

import { Routes } from '@/config/routes'
import { cn } from '@/lib/utils'

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
                    scrolled ? 'mx-1 px-4 pt-3.5' : 'px-0 pt-0',
                )}>
                <header
                    className={cn(
                        'max-w-content pointer-events-auto flex h-[var(--header-height)] w-full items-center justify-between border border-transparent px-7 transition-all duration-300 ease-[var(--ease-out)]',
                        scrolled
                            ? 'border-border rounded-2xl bg-[color:color-mix(in_oklch,var(--paper)_82%,transparent)] shadow-[var(--card-shadow)] backdrop-blur-[10px]'
                            : 'bg-transparent',
                    )}>
                    <Link href='/' aria-label='Homepage' className='flex items-center gap-2.5'>
                        <Image
                            src={LogoImage}
                            alt=''
                            width={26}
                            height={26}
                            placeholder='blur'
                            className='rounded-[7px]'
                        />
                        <span className='font-heading text-[17px] font-semibold tracking-[-0.01em]'>
                            LinkedInPreview
                        </span>
                    </Link>

                    <div className='flex items-center gap-6'>
                        <Navbar />
                        <div className='flex items-center gap-2'>
                            <Button asChild variant='ghost' size='lg' className='hidden md:flex'>
                                <Link href={Routes.Dashboard}>Dashboard</Link>
                            </Button>
                            <Button asChild size='lg' className='hidden md:flex'>
                                <Link href={Routes.Tool}>
                                    Start free
                                    <ArrowRight className='size-4' />
                                </Link>
                            </Button>
                            <MobileNav />
                        </div>
                    </div>
                </header>
            </div>
        </>
    )
}
