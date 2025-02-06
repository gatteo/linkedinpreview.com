import Link from 'next/link'

import { Routes } from '@/config/routes'

import { Logo } from './logo'

export function Footer() {
    return (
        <footer className='container mx-auto max-w-6xl py-12'>
            <div className='row-gap-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='col-span-2 space-y-2'>
                    <div className='flex items-center'>
                        <Logo className='size-6' />
                        <span className='ml-2 text-xl font-bold'>LinkedIn Post Preview</span>
                    </div>
                    <p className='text-balance text-sm text-muted-foreground'>
                        LinkedInPreview.com is a free online tool that allows you to write, format, and preview your
                        LinkedIn posts before publishing them.
                    </p>
                </div>
                <div className='flex flex-col space-y-2'>
                    <h3 className='text-sm font-semibold'>Useful Links</h3>
                    <Link className='text-sm text-muted-foreground hover:underline' href={Routes.Tool}>
                        Preview & Formatting Tool
                    </Link>
                    <Link className='text-sm text-muted-foreground hover:underline' href={Routes.AllFeatures}>
                        All the Features
                    </Link>
                    <Link className='text-sm text-muted-foreground hover:underline' href={Routes.HowItWorks}>
                        How It Works
                    </Link>
                </div>

                <div className='flex flex-col space-y-2'>
                    <h3 className='text-sm font-semibold'>Guides & Resources</h3>
                    <Link className='text-sm text-muted-foreground hover:underline' href='#'>
                        Resource 1
                    </Link>
                    <Link className='text-sm text-muted-foreground hover:underline' href='#'>
                        Resource 2
                    </Link>
                    <Link className='text-sm text-muted-foreground hover:underline' href='#'>
                        Resource 3
                    </Link>
                </div>
            </div>
            <div className='mt-10 space-y-4 border-t pt-10'>
                <p className='text-sm text-muted-foreground '>
                    Created by{' '}
                    <Link
                        className='font-semibold'
                        href='https://matteogiardino.com?utm_source=linkedinpreview.com&utm_content=footer'>
                        Matteo Giardino
                    </Link>{' '}
                    - Copywright &copy; {new Date().getFullYear()}
                </p>
            </div>
        </footer>
    )
}
