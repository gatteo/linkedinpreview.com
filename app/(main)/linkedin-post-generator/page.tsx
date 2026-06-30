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
import { GeneratorTool } from '@/components/generator/generator-tool'
import { CtaSection } from '@/components/home/cta-section'
import { Features } from '@/components/home/features'
import { HowToUse } from '@/components/home/how-to-use'
import { Reason } from '@/components/home/reason'
import { StarRating } from '@/components/home/star-rating'

const description =
    'Free LinkedIn post generator. Describe your topic, pick a tone, and let AI write your post, then preview and format it live. No signup, no paywall.'

export const metadata: Metadata = {
    title: { absolute: 'Free LinkedIn Post Generator - AI Writer, No Signup' },
    description,
    alternates: {
        canonical: absoluteUrl(Routes.Generator),
    },
    openGraph: {
        title: 'Free LinkedIn Post Generator - AI Writer, No Signup',
        description,
        url: absoluteUrl(Routes.Generator),
    },
}

const GeneratorFAQList = [
    {
        question: 'Is the LinkedIn post generator free?',
        answer: 'Yes, the LinkedIn Post Generator is completely free. There is no paywall, no credit card, and no usage cost - describe your topic, pick a tone, and the AI writes your post.',
    },
    {
        question: 'Do I need to sign up or log in?',
        answer: 'No. You can generate posts without creating an account or logging in. The generator works straight from the page, so you can go from idea to finished post in seconds.',
    },
    {
        question: 'How does the AI generate posts?',
        answer: 'You describe what you want to post about and choose a tone. The AI then writes a complete LinkedIn post with a strong hook, readable short paragraphs, and relevant hashtags, following proven LinkedIn writing best practices.',
    },
    {
        question: 'Can I edit and format the generated post?',
        answer: 'Absolutely. Every generated post drops straight into the live editor, where you can rewrite any line and add bold, italic, underline, or list formatting before you copy it to LinkedIn.',
    },
    {
        question: 'Can I preview how it looks before posting?',
        answer: 'Yes. The generated post appears instantly in the live preview panel, so you can see exactly how it will look on mobile and desktop, including where LinkedIn truncates with "see more", before you publish.',
    },
    {
        question: 'What tones can I choose for my post?',
        answer: 'You can pick from professional, casual, inspirational, educational, storytelling, and humorous tones. Each tone shapes the voice of the post so it matches your audience and goal.',
    },
]

// Section: Cross-tool and writing guides
const GeneratorLinks = [
    { href: Routes.Home || '/', label: 'LinkedIn post preview' },
    { href: Routes.Formatter, label: 'LinkedIn post formatter' },
    { href: Routes.LinkPreview, label: 'LinkedIn link preview' },
    { href: Routes.BlogPost('ai-linkedin-post-generator-guide'), label: 'AI LinkedIn post generator guide' },
    { href: Routes.BlogPost('best-ai-prompts-for-linkedin-posts'), label: 'Best AI prompts for LinkedIn posts' },
    { href: Routes.BlogPost('how-to-use-ai-to-write-linkedin-posts'), label: 'How to use AI to write posts' },
]

function GeneratorHero() {
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
                        Free LinkedIn Post Generator
                    </h1>
                </AnimateIn>

                <AnimateIn delay={0.2}>
                    <p className='text-muted-foreground mx-auto mb-8 max-w-[560px] text-center text-lg leading-7 md:text-xl md:leading-8'>
                        The free AI generator that writes your LinkedIn post. Describe your topic, pick a tone, and
                        preview the result live, with no signup and no paywall.
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
                            Generate a Post
                            <ArrowDown className='animate-bounce-down ml-0.5 size-4' />
                        </Link>
                    </Button>
                </AnimateIn>
            </div>
        </DotBackground>
    )
}

function GeneratorLinksSection() {
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
                    <div className='dash-top grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                        {GeneratorLinks.map((link) => (
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

function GeneratorFAQSection() {
    const faqSchema: WithContext<FAQPage> = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': GeneratorFAQList.map((faq) => ({
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
                        Common questions about the LinkedIn Post Generator.
                    </p>
                </AnimateIn>

                <AnimateIn>
                    <div className='dash-top grid lg:grid-cols-[5fr_3fr]'>
                        <div className='dash-right p-6'>
                            <Accordion type='multiple'>
                                {GeneratorFAQList.map((faq) => (
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

export default function GeneratorPage() {
    const softwareSchema: WithContext<SoftwareApplication> = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'LinkedIn Post Generator',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web Browser',
        'url': `${site.url}/linkedin-post-generator#tool`,
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
            'AI LinkedIn post generation',
            'Tone selection (professional, casual, inspirational, and more)',
            'Live LinkedIn post preview',
            'Bold, italic, and underline formatting',
            'Mobile and desktop preview',
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
                <GeneratorHero />
                <GeneratorTool />
                <HowToUse />
            </div>

            <div className='max-w-content border-border mx-auto border-x'>
                <Reason />
                <Features />
                <GeneratorLinksSection />
                <GeneratorFAQSection />
            </div>

            <CtaSection />
        </>
    )
}
