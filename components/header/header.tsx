import * as React from 'react'
import Link from 'next/link'

import { Routes } from '@/config/routes'

import { Logo } from '../logo'
import { Button } from '../ui/button'
import { MobileNav } from './mobile-nav'
import { Navbar } from './navbar'

export function Header() {
    return (
        <header className='fixed inset-x-0 top-0 z-40 bg-white/80 shadow-sm backdrop-blur-[10px]'>
            <div className='mx-auto flex h-[60px] max-w-6xl items-center justify-between px-8'>
                <Logo className='pr-20' />
                <div className='flex items-center gap-2'>
                    <Navbar />
                    <Button asChild size='sm' className='md:hidden'>
                        <Link href={Routes.Tool}>Get Started, It's Free</Link>
                    </Button>
                    <MobileNav />
                </div>
                <Button asChild size='sm' className='hidden md:flex'>
                    <Link href={Routes.Tool}>Get Started, It's Free</Link>
                </Button>
            </div>
        </header>
    )
}
