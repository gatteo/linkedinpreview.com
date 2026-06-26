import { type Metadata } from 'next'
import Link from 'next/link'
import { absoluteUrl } from '@/utils/urls'
import { ArrowDown } from 'lucide-react'
import { type FAQPage, type SoftwareApplication, type WithContext } from 'schema-dts'

import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AnimateIn } from '@/components/ui/animate-in'
import { Button } from '@/components/ui/button'
import { DotBackground } from '@/components/ui/dot-background'
import { CtaSection } from '@/components/home/cta-section'
import { Features } from '@/components/home/features'
import { HowToUse } from '@/components/home/how-to-use'
import { Reason } from '@/components/home/reason'
import { StarRating } from '@/components/home/star-rating'
import { Tool } from '@/components/tool/tool'

export const metadata: Metadata = {
    title: { absolute: 'LinkedIn Post Formatter - Bold, Italic & Lists Tool' },
    description:
        'Free LinkedIn post formatter. Add bold, italic, underline text and bullet or numbered lists, then preview your post on mobile and desktop before publishing. No signup.',
    alternates: {
        canonical: absoluteUrl(Routes.Formatter),
    },
    openGraph: {
        title: 'LinkedIn Post Formatter - Bold, Italic & Lists Tool',
        description:
            'Free LinkedIn post formatter. Add bold, italic, underline text and bullet or numbered lists, then preview your post on mobile and desktop before publishing. No signup.',
        url: absoluteUrl(Routes.Formatter),
    },
}

const FormatterFAQList = [
    {
        question: 'Is the LinkedIn post formatter free?',
        answer: 'Yes, the LinkedIn Post Formatter is completely free to use. No account, no signup, and no hidden fees - just open the page and start formatting.',
    },
    {
        question: 'Does LinkedIn support bold and italic text natively?',
        answer: 'LinkedIn does not support standard HTML bold or italic tags in posts. The formatter uses Unicode lookalike characters to achieve bold and italic styling that renders correctly inside LinkedIn posts and comments.',
    },
    {
        question: 'How does the formatter add bold and italic text?',
        answer: 'When you apply bold or italic formatting in the editor, the tool converts your text to Unicode Mathematical Alphanumeric Symbols. These characters look like bold or italic letters but are accepted by LinkedIn as plain text, so your formatting survives the copy-paste step.',
    },
    {
        question: 'Will my formatting look right on mobile?',
        answer: 'Yes. The preview panel shows your post exactly as it would appear on mobile, tablet, and desktop. Switch between device sizes before copying to make sure your hook line and formatting look as intended on every screen.',
    },
    {
        question: 'Can I add bullet point and numbered lists to LinkedIn posts?',
        answer: 'Absolutely. The formatter supports both bullet point lists and numbered lists. Select your lines, apply the list format, and the editor inserts Unicode list markers that display correctly inside LinkedIn.',
    },
]

// Section: Formatting guides
const FormattingGuides = [
    { href: '/blog/linkedin-posts-text-formatting', label: 'LinkedIn text formatting guide' },
    { href: '/blog/how-to-add-bold-text-to-linkedin-posts', label: 'How to add bold text' },
    { href: '/blog/how-to-add-italics-text-to-linkedin-posts', label: 'How to add italic text' },
    { href: '/blog/how-to-underline-text-in-linkedin-posts', label: 'How to underline text' },
    { href: '/blog/how-to-add-strikethrough-text-to-linkedin-posts', label: 'How to add strikethrough' },
    { href: '/blog/how-to-add-bullet-point-lists-to-linkedin-posts', label: 'How to add bullet lists' },
    { href: '/blog/how-to-add-numbered-lists-to-linkedin-posts', label: 'How to add numbered lists' },
]

function FormatterHero() {
    return (
        <DotBackground className='overflow-hidden'>
            <div className='mx-auto flex flex-col items-center px-6 py-20 md:pt-28'>
                <AnimateIn delay={0}>
                    <p className='border-border shadow-subtle mb-6 flex items-center gap-2 rounded-full border bg-white px-4 py-1 text-xs text-neutral-600 sm:text-sm'>
                        Free - No signup required
                    </p>
                </AnimateIn>

                <AnimateIn delay={0.1}>
                    <h1 className='font-heading mb-5 text-center text-5xl font-bold tracking-[-0.02em] text-balance text-neutral-900 md:text-6xl lg:text-7xl'>
                        LinkedIn Post Formatter
                    </h1>
                </AnimateIn>

                <AnimateIn delay={0.2}>
                    <p className='mx-auto mb-8 max-w-[560px] text-center text-lg leading-7 text-neutral-500 md:text-xl md:leading-8'>
                        The free LinkedIn post editor for bold, italic, underline, and lists. Format your post, then
                        preview it on mobile and desktop before you publish.
                    </p>
                </AnimateIn>

                <AnimateIn delay={0.3}>
                    <div className='mb-8 flex items-center gap-2 rounded-full bg-neutral-50 px-4 py-2'>
                        <StarRating />
                        <span className='text-xs font-medium text-neutral-500 sm:text-sm'>
                            Trusted by thousands of LinkedIn creators
                        </span>
                    </div>
                </AnimateIn>

                <AnimateIn delay={0.4}>
                    <Button asChild size='lg' className='rounded-lg'>
                        <Link href='#tool'>
                            Open Formatter
                            <ArrowDown className='animate-bounce-down ml-0.5 size-4' />
                        </Link>
                    </Button>
                </AnimateIn>
            </div>
        </DotBackground>
    )
}

function FormattingGuidesSection() {
    return (
        <section className='border-border border-t'>
            <div className='pt-20 md:pt-24'>
                <AnimateIn className='mb-6 px-6'>
                    <p className='text-primary mb-2 text-sm font-semibold tracking-wider uppercase'>Learn more</p>
                    <h2 className='font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl'>
                        LinkedIn formatting guides
                    </h2>
                    <p className='mt-3 max-w-lg text-base text-neutral-500'>
                        Step-by-step articles covering every formatting option available in LinkedIn posts.
                    </p>
                </AnimateIn>

                <AnimateIn>
                    <div className='dash-top grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                        {FormattingGuides.map((guide) => (
                            <Link
                                key={guide.href}
                                href={guide.href}
                                className='border-border group flex items-center gap-3 p-6 transition-colors hover:bg-neutral-50'>
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
                                <span className='text-sm font-medium text-neutral-800 group-hover:text-neutral-900'>
                                    {guide.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}

function FormatterFAQSection() {
    const faqSchema: WithContext<FAQPage> = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': FormatterFAQList.map((faq) => ({
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
                    <h2 className='font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl'>
                        Frequently Asked Questions
                    </h2>
                    <p className='mt-3 max-w-lg text-base text-neutral-500'>
                        Common questions about the LinkedIn Post Formatter.
                    </p>
                </AnimateIn>

                <AnimateIn>
                    <div className='dash-top grid lg:grid-cols-[5fr_3fr]'>
                        <div className='dash-right p-6'>
                            <Accordion type='multiple'>
                                {FormatterFAQList.map((faq) => (
                                    <AccordionItem key={faq.question} value={faq.question} className='border-border'>
                                        <AccordionTrigger className='gap-4 text-start text-base font-medium text-neutral-900 hover:no-underline'>
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className='text-sm leading-relaxed text-neutral-500'>
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>

                        <div className='dash-left relative hidden lg:block'>
                            <div
                                className='pointer-events-none absolute inset-0 text-neutral-100'
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

export default function FormatterPage() {
    const softwareSchema: WithContext<SoftwareApplication> = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'LinkedIn Post Formatter',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web Browser',
        'url': `${site.url}/formatter#tool`,
        'description':
            'Free LinkedIn post formatter. Add bold, italic, underline text and bullet or numbered lists, then preview your post on mobile and desktop before publishing. No signup.',
        'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD',
        },
        'featureList': [
            'Bold, italic, underline, strikethrough text formatting',
            'Bullet point and numbered lists',
            'Real-time LinkedIn post preview',
            'Mobile and desktop preview',
            'Character counter',
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
                <FormatterHero />
                <Tool />
                <HowToUse />
            </div>

            <div className='max-w-content border-border mx-auto border-x'>
                <Reason />
                <Features />
                <FormattingGuidesSection />
                <FormatterFAQSection />
            </div>

            <CtaSection />
        </>
    )
}
