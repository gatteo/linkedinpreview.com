import Link from 'next/link'

import { Routes } from '@/config/routes'
import { ExternalLinks } from '@/config/urls'

import { FeedbackLink } from './feedback/feedback-link'
import { Logo } from './logo'

export function Footer() {
    return (
        <footer className='border-t border-border bg-white'>
            <div className='mx-auto max-w-content px-6 py-16'>
                <div className='flex flex-col gap-12 md:flex-row md:justify-between'>
                    {/* Logo & description */}
                    <div className='max-w-[280px]'>
                        <div className='flex items-center gap-2'>
                            <Logo className='size-7' />
                            <span className='text-lg font-bold text-neutral-900'>LinkedIn Preview</span>
                        </div>
                        <p className='mt-3 text-sm leading-relaxed text-neutral-500'>
                            A free tool to write, format, and preview your LinkedIn posts before publishing.
                        </p>
                        {/* Social */}
                        <div className='mt-6 flex items-center gap-4'>
                            <Link
                                href={ExternalLinks.GitHub}
                                className='text-neutral-500 transition-colors hover:text-neutral-900'>
                                <svg className='size-5' fill='currentColor' viewBox='0 0 24 24'>
                                    <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                                </svg>
                            </Link>
                            <Link
                                href='https://www.linkedin.com/in/matteo-giardino'
                                className='text-neutral-500 transition-colors hover:text-neutral-900'>
                                <svg className='size-5' fill='currentColor' viewBox='0 0 24 24'>
                                    <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
                                </svg>
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
                <div className='mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row'>
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
