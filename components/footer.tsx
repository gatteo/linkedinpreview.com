import Link from 'next/link'

import { Routes } from '@/config/routes'
import { ExternalLinks } from '@/config/urls'
import { getAllComparisons } from '@/lib/compare'

import { FeedbackLink } from './feedback/feedback-link'
import { Icons } from './icon'
import { Logo } from './logo'

const linkClass = 'text-muted-foreground hover:text-foreground text-[12.5px] transition-colors'

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h4 className='text-foreground mb-3.5 text-[13px] font-semibold'>{title}</h4>
            <ul className='flex flex-col gap-2.5'>{children}</ul>
        </div>
    )
}

export function Footer() {
    const comparisons = getAllComparisons()

    return (
        <footer className='border-border border-t'>
            <div className='max-w-content border-border mx-auto border-x px-7 pt-16'>
                <div className='flex flex-wrap justify-between gap-12'>
                    <div className='max-w-[300px]'>
                        <div className='flex items-center gap-2.5'>
                            <Logo className='size-7' />
                            <span className='font-heading text-[17px] font-semibold tracking-[-0.01em]'>
                                LinkedIn Post Preview
                            </span>
                        </div>
                        <p className='text-muted-foreground mt-3.5 text-[13.5px] leading-relaxed'>
                            LinkedInPreview.com is a free online tool that allows you to write, format, and preview your
                            LinkedIn posts before publishing them.
                        </p>
                        <div className='mt-5.5 flex items-center gap-3.5'>
                            <Link
                                href={ExternalLinks.GitHub}
                                aria-label='View source on GitHub'
                                className='text-muted-foreground hover:text-foreground transition-colors'>
                                <Icons.github className='size-5' />
                            </Link>
                            <Link
                                href='https://www.linkedin.com/in/matteo-giardino'
                                aria-label='LinkedIn profile'
                                className='text-muted-foreground hover:text-foreground transition-colors'>
                                <Icons.linkedin className='size-5' />
                            </Link>
                        </div>
                    </div>

                    <div className='grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4 md:min-w-[460px] md:flex-none'>
                        <FooterCol title='Product'>
                            <li>
                                <Link className={linkClass} href={Routes.Tool}>
                                    Linkedin Preview Tool
                                </Link>
                            </li>
                            <li>
                                <Link className={linkClass} href={Routes.Generator}>
                                    LinkedIn Post Generator
                                </Link>
                            </li>
                            <li>
                                <Link className={linkClass} href={Routes.LinkPreview}>
                                    LinkedIn Link Preview
                                </Link>
                            </li>
                            <li>
                                <Link className={linkClass} href={Routes.Formatter}>
                                    LinkedIn Post Formatter
                                </Link>
                            </li>
                            <li>
                                <Link className={linkClass} href={Routes.AllFeatures}>
                                    All Features
                                </Link>
                            </li>
                            <li>
                                <Link className={linkClass} href={Routes.HowItWorks}>
                                    How It Works
                                </Link>
                            </li>
                            <li>
                                <Link className={linkClass} href={Routes.EmbedSection}>
                                    Embed this Tool
                                </Link>
                            </li>
                        </FooterCol>
                        <FooterCol title='Resources'>
                            <li>
                                <Link className={linkClass} href={Routes.Blog}>
                                    Blog & Guides
                                </Link>
                            </li>
                            <li>
                                <Link className={linkClass} href={Routes.Faqs}>
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <FeedbackLink />
                            </li>
                        </FooterCol>
                        <FooterCol title='Guides'>
                            <li>
                                <Link
                                    className={linkClass}
                                    href={Routes.BlogPost('linkedin-algorithm-tips-increase-post-reach')}>
                                    Linkedin Algorithm Tips
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className={linkClass}
                                    href={Routes.BlogPost('linkedin-profile-optimization-complete-guide')}>
                                    Linkedin Profile Optimization
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className={linkClass}
                                    href={Routes.BlogPost('how-to-write-linkedin-posts-that-get-comments')}>
                                    How to Get More Comments
                                </Link>
                            </li>
                        </FooterCol>
                        <FooterCol title='Compare'>
                            {comparisons.map((comparison) => (
                                <li key={comparison.slug}>
                                    <Link className={linkClass} href={comparison.url}>
                                        {comparison.competitor}
                                    </Link>
                                </li>
                            ))}
                        </FooterCol>
                    </div>
                </div>

                <div className='border-border -mx-7 mt-14 flex flex-wrap items-center justify-between gap-3 border-t px-7 py-7'>
                    <p className='text-muted-foreground text-[13.5px]'>
                        Created by{' '}
                        <Link
                            className='text-petrol-700 font-medium hover:underline'
                            href='https://matteogiardino.com?utm_source=linkedinpreview.com&utm_content=footer'>
                            Matteo Giardino
                        </Link>
                    </p>
                    <p className='text-muted-foreground text-[13.5px]'>
                        &copy; {new Date().getFullYear()} LinkedIn Post Preview
                    </p>
                </div>
            </div>
        </footer>
    )
}
