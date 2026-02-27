import * as React from 'react'
import Link from 'next/link'

import { Routes } from '@/config/routes'

import { Logo } from '../logo'
import { Button } from '../ui/button'
import { MobileNav } from './mobile-nav'
import { Navbar } from './navbar'

export function Header() {
    return (
        <header className='border-border fixed inset-x-0 top-0 z-40 border-b bg-white/80 backdrop-blur-2xl'>
            <div className='max-w-content mx-auto flex h-[var(--header-height)] items-center justify-between px-6'>
                <div className='flex items-center gap-8'>
                    <Logo />
                    <Navbar />
                </div>
                <div className='flex items-center gap-3'>
                    <Button asChild size='lg' className='hidden rounded-lg md:flex'>
                        <Link href={Routes.Tool}>Get Started</Link>
                    </Button>
                    <MobileNav />
                </div>
            </div>
        </header>
    )
}
