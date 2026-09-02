import { type Metadata } from 'next'
import Link from 'next/link'
import { absoluteUrl } from '@/utils/urls'
import { ArrowDown } from 'lucide-react'
import { type FAQPage, type SoftwareApplication, type WithContext } from 'schema-dts'

import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { SOCIAL_PROOF } from '@/config/social-proof'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AnimateIn } from '@/components/ui/animate-in'
import { Button } from '@/components/ui/button'
import { DotBackground } from '@/components/ui/dot-background'
import { CtaSection } from '@/components/home/cta-section'
import { StarRating } from '@/components/home/star-rating'
import { LinkPreviewTool } from '@/components/link-preview/link-preview-tool'

const description =
    'Free LinkedIn link preview tool. Paste a URL to test how your link looks on LinkedIn, check its Open Graph tags, and fix preview issues before you share. No signup.'

export const metadata: Metadata = {
    title: { absolute: 'LinkedIn Link Preview - Test Your URL Open Graph Card' },
    description,
    alternates: {
        canonical: absoluteUrl(Routes.LinkPreview),
    },
    openGraph: {
        title: 'LinkedIn Link Preview - Test Your URL Open Graph Card',
        description,
        url: absoluteUrl(Routes.LinkPreview),
    },
}

const LinkPreviewFAQList = [
    {
        question: 'Why does my LinkedIn link preview look wrong?',
        answer: "LinkedIn builds its link card from the Open Graph tags in your page's raw HTML. If your og:title, og:description, or og:image are missing, malformed, or rendered with JavaScript, the card can show the wrong text, no image, or a bare URL. Paste your link above to see exactly which tags LinkedIn can read.",
    },
    {
        question: 'How do I refresh a LinkedIn link preview?',
        answer: "LinkedIn caches a link preview for about 7 days, and no third-party tool can force a refresh. To update it, change your Open Graph tags, then either re-share the link (adding a query parameter like ?v=2 makes it a new URL) or run the link through LinkedIn's official Post Inspector, which re-scrapes the page for you.",
    },
    {
        question: 'What image size does LinkedIn use for link previews?',
        answer: 'Use an og:image that is 1200x627 pixels (a 1.91:1 ratio) for the best result. Keep the file in JPG or PNG and under roughly 5 MB, since LinkedIn rejects oversized files. Smaller or square images may render as a small thumbnail card instead of a large one.',
    },
    {
        question: 'Why is my image not showing in the LinkedIn preview?',
        answer: 'The most common causes are a missing og:image tag, an image in WebP format (LinkedIn does not render WebP), an oversized file, or an image URL that is not publicly reachable. Switch to a JPG or PNG at 1200x627 and make sure the image URL returns a 200 response without requiring a login.',
    },
    {
        question: 'Why are my Open Graph tags not detected?',
        answer: 'LinkedIn reads the raw HTML of your page and does not run JavaScript. If your site injects Open Graph tags client-side with a framework, the crawler never sees them. Render your og: tags server-side or pre-render them so they appear in the initial HTML response.',
    },
]

// Section: Cross-tool and guide links
const LinkPreviewLinks = [
    { href: Routes.Home || '/', label: 'LinkedIn post preview' },
    { href: Routes.Formatter, label: 'LinkedIn post formatter' },
    { href: Routes.Generator, label: 'LinkedIn post generator' },
    { href: Routes.BlogPost('how-to-fix-linkedin-link-previews'), label: 'How to fix LinkedIn link previews' },
]

function LinkPreviewHero() {
    return (
        <DotBackground className='overflow-hidden'>
            <div className='mx-auto flex flex-col items-center px-6 py-20 md:pt-28'>
                <AnimateIn delay={0}>
                    <p className='border-border shadow-subtle bg-background text-muted-foreground mb-6 flex items-center gap-2 rounded-full border px-4 py-1 text-xs sm:text-sm'>
                        Free - No signup required
                    </p>
                </AnimateIn>

                <AnimateIn delay={0.1}>
                    <h1 className='font-heading text-foreground mb-5 text-center text-5xl font-bold tracking-[-0.02em] text-balance md:text-6xl lg:text-7xl'>
                        LinkedIn Link Preview
                    </h1>
                </AnimateIn>

                <AnimateIn delay={0.2}>
                    <p className='text-muted-foreground mx-auto mb-8 max-w-[560px] text-center text-lg leading-7 md:text-xl md:leading-8'>
                        Paste a URL to see how your link card will look on LinkedIn, on desktop and mobile. Then check
                        your Open Graph tags and fix any issues before you share.
                    </p>
                </AnimateIn>

                <AnimateIn delay={0.3}>
                    <div className='bg-secondary mb-8 flex items-center gap-2 rounded-full px-4 py-2'>
                        <StarRating />
                        <span className='text-muted-foreground text-xs font-medium sm:text-sm'>
                            Trusted by thousands of LinkedIn creators
                        </span>
                    </div>
                </AnimateIn>

                <AnimateIn delay={0.4}>
                    <Button asChild size='lg' className='rounded-lg'>
                        <Link href='#tool'>
                            Preview a Link
                            <ArrowDown className='animate-bounce-down ml-0.5 size-4' />
                        </Link>
                    </Button>
                </AnimateIn>
            </div>
        </DotBackground>
    )
}

function LinkPreviewLinksSection() {
    return (
        <section className='border-border border-t'>
            <div className='pt-20 md:pt-24'>
                <AnimateIn className='mb-6 px-6'>
                    <p className='text-primary mb-2 text-sm font-semibold tracking-wider uppercase'>Explore more</p>
                    <h2 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
                        More LinkedIn tools and guides
                    </h2>
                    <p className='text-muted-foreground mt-3 max-w-lg text-base'>
                        Preview, format, and write better LinkedIn posts with our free tools and step-by-step guides.
                    </p>
                </AnimateIn>

                <AnimateIn>
                    <div className='dash-top grid sm:grid-cols-2 lg:grid-cols-4'>
                        {LinkPreviewLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className='border-border group hover:bg-accent flex items-center gap-3 p-6 transition-colors'>
                                <div className='bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg'>
                                    <svg
                                        className='text-primary size-4'
                                        viewBox='0 0 16 16'
                                        fill='none'
                                        aria-hidden='true'>
                                        <path
                                            d='M3 8h10M9 4l4 4-4 4'
                                            stroke='currentColor'
                                            strokeWidth='1.5'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                        />
                                    </svg>
                                </div>
                                <span className='text-muted-foreground group-hover:text-foreground text-sm font-medium'>
                                    {link.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}

function LinkPreviewFAQSection() {
    const faqSchema: WithContext<FAQPage> = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': LinkPreviewFAQList.map((faq) => ({
            '@type': 'Question',
            'name': faq.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': faq.answer,
            },
        })),
    }

    return (
        <section id='faqs' className='border-border border-t'>
            <div className='pt-20 md:pt-24'>
                <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

                <AnimateIn className='mb-6 px-6'>
                    <h2 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
                        Frequently Asked Questions
                    </h2>
                    <p className='text-muted-foreground mt-3 max-w-lg text-base'>
                        Common questions about LinkedIn link previews and Open Graph tags.
                    </p>
                </AnimateIn>

                <AnimateIn>
                    <div className='dash-top grid lg:grid-cols-[5fr_3fr]'>
                        <div className='dash-right p-6'>
                            <Accordion type='multiple'>
                                {LinkPreviewFAQList.map((faq) => (
                                    <AccordionItem key={faq.question} value={faq.question} className='border-border'>
                                        <AccordionTrigger className='text-foreground gap-4 text-start text-base font-medium hover:no-underline'>
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className='text-muted-foreground text-sm leading-relaxed'>
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>

                        <div className='dash-left relative hidden lg:block'>
                            <div
                                className='text-border pointer-events-none absolute inset-0'
                                style={{
                                    backgroundImage:
                                        'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
                                }}
                            />
                        </div>
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}

export default function LinkPreviewPage() {
    const softwareSchema: WithContext<SoftwareApplication> = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'LinkedIn Link Preview',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web Browser',
        'url': `${site.url}/linkedin-link-preview#tool`,
        'description': description,
        'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD',
        },
        'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': SOCIAL_PROOF.rating,
            'bestRating': '5',
            'worstRating': '1',
            'ratingCount': Number(SOCIAL_PROOF.count.replace(/,/g, '')),
        },
        'featureList': [
            'URL Open Graph and Twitter card preview',
            'Desktop and mobile LinkedIn link card preview',
            'Open Graph tag checklist with copy-paste fixes',
            'WebP and image size warnings',
            'Reads raw HTML like the LinkedIn crawler',
            'Free to use, no signup',
        ],
        'screenshot': `${site.url}/images/og/og.png`,
        'provider': {
            '@type': 'Organization',
            'name': 'LinkedIn Post Preview',
            'url': site.url,
        },
    }

    return (
        <>
            <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />

            <div className='max-w-content border-border mx-auto border-x'>
                <LinkPreviewHero />
                <LinkPreviewTool />
            </div>

            <div className='max-w-content border-border mx-auto border-x'>
                <LinkPreviewLinksSection />
                <LinkPreviewFAQSection />
            </div>

            <CtaSection />
        </>
    )
}
