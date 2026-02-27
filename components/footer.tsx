import Link from 'next/link'

import { Routes } from '@/config/routes'
import { ExternalLinks } from '@/config/urls'

import { FeedbackLink } from './feedback/feedback-link'
import { Icons } from './icon'
import { Logo } from './logo'

export function Footer() {
    return (
        <footer className='border-border border-t bg-white'>
            <div className='max-w-content mx-auto px-6 py-16'>
                <div className='flex flex-col gap-12 md:flex-row md:justify-between'>
                    {/* Logo & description */}
                    <div className='max-w-md'>
                        <div className='flex items-center gap-2'>
                            <Logo className='size-7' />
                            <span className='text-lg font-bold text-neutral-900'>LinkedIn Post Preview</span>
                        </div>
                        <p className='mt-3 text-sm leading-relaxed text-neutral-500'>
                            LinkedInPreview.com is a free online tool that allows you to write, format, and preview your
                            LinkedIn posts before publishing them.
                        </p>
                        {/* Social */}
                        <div className='mt-6 flex items-center gap-4'>
                            <Link
                                href={ExternalLinks.GitHub}
                                aria-label='View source on GitHub'
                                className='text-neutral-500 transition-colors hover:text-neutral-900'>
                                <Icons.github className='size-5' />
                            </Link>
                            <Link
                                href='https://www.linkedin.com/in/matteo-giardino'
                                aria-label='LinkedIn profile'
                                className='text-neutral-500 transition-colors hover:text-neutral-900'>
                                <Icons.linkedin className='size-5' />
                            </Link>
                        </div>
                    </div>

                    {/* Link columns */}
                    <div className='grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3 md:max-w-[520px]'>
                        <div>
                            <h4 className='mb-4 text-sm font-semibold text-neutral-900'>Product</h4>
                            <ul className='space-y-2.5'>
                                <li>
                                    <Link
                                        className='text-sm text-neutral-500 transition-colors hover:text-neutral-900'
                                        href={Routes.Tool}>
                                        Preview Tool
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className='text-sm text-neutral-500 transition-colors hover:text-neutral-900'
                                        href={Routes.AllFeatures}>
                                        All Features
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className='text-sm text-neutral-500 transition-colors hover:text-neutral-900'
                                        href={Routes.HowItWorks}>
                                        How It Works
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className='text-sm text-neutral-500 transition-colors hover:text-neutral-900'
                                        href={Routes.EmbedSection}>
                                        Embed Tool
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className='mb-4 text-sm font-semibold text-neutral-900'>Resources</h4>
                            <ul className='space-y-2.5'>
                                <li>
                                    <Link
                                        className='text-sm text-neutral-500 transition-colors hover:text-neutral-900'
                                        href={Routes.Blog}>
                                        Blog & Guides
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className='text-sm text-neutral-500 transition-colors hover:text-neutral-900'
                                        href={Routes.Faqs}>
                                        FAQ
                                    </Link>
                                </li>
                                <li>
                                    <FeedbackLink />
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className='mb-4 text-sm font-semibold text-neutral-900'>Guides</h4>
                            <ul className='space-y-2.5'>
                                <li>
                                    <Link
                                        className='text-sm text-neutral-500 transition-colors hover:text-neutral-900'
                                        href={Routes.BlogPost('linkedin-algorithm-tips-increase-post-reach')}>
                                        Algorithm Tips
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className='text-sm text-neutral-500 transition-colors hover:text-neutral-900'
                                        href={Routes.BlogPost('linkedin-profile-optimization-complete-guide')}>
                                        Profile Optimization
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className='text-sm text-neutral-500 transition-colors hover:text-neutral-900'
                                        href={Routes.BlogPost('how-to-write-linkedin-posts-that-get-comments')}>
                                        Get More Comments
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className='border-border mt-16 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row'>
                    <p className='text-sm text-neutral-500'>
                        Created by{' '}
                        <Link
                            className='font-medium text-neutral-700 transition-colors hover:text-neutral-900'
                            href='https://matteogiardino.com?utm_source=linkedinpreview.com&utm_content=footer'>
                            Matteo Giardino
                        </Link>
                    </p>
                    <p className='text-sm text-neutral-500'>&copy; {new Date().getFullYear()} LinkedIn Post Preview</p>
                </div>
            </div>
        </footer>
    )
}
