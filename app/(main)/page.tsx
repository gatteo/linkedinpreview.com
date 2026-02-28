import { type Organization, type SoftwareApplication, type WebSite, type WithContext } from 'schema-dts'

import { site } from '@/config/site'
import { CtaSection } from '@/components/home/cta-section'
import { EmbedSection } from '@/components/home/embed-section'
import { FAQs } from '@/components/home/faqs'
import { Features } from '@/components/home/features'
import { Hero } from '@/components/home/hero'
import { HowToUse } from '@/components/home/how-to-use'
import { OpenSource } from '@/components/home/opensource'
import { Reason } from '@/components/home/reason'
import { Tool } from '@/components/tool/tool'

export default function Page() {
    const organizationSchema: WithContext<Organization> = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${site.url}/#organization`,
        'name': 'LinkedIn Post Preview',
        'url': site.url,
        'logo': site.logo,
        'description': site.description,
        'founder': {
            '@type': 'Person',
            'name': 'Matteo Giardino',
            'url': 'https://matteogiardino.com',
        },
        'sameAs': ['https://twitter.com/mattegiardino', 'https://github.com/gatteo/linkedinpreview.com'],
    }

    const websiteSchema: WithContext<WebSite> = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${site.url}/#website`,
        'name': site.title,
        'url': site.url,
        'description': site.description,
        'publisher': {
            '@id': `${site.url}/#organization`,
        },
    }

    const softwareSchema: WithContext<SoftwareApplication> = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'LinkedIn Post Preview Tool',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web Browser',
        'url': `${site.url}/#tool`,
        'description':
            'Free LinkedIn post preview tool. Free online tool to write, format, and preview LinkedIn posts with bold, italic, underline text and lists. See how Linkedin posts will look on mobile and desktop before publishing. Improve engagement and professionalism.',
        'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD',
        },
        'featureList': [
            'Real-time LinkedIn post preview',
            'Mobile and desktop preview',
            'Text formatting: bold, italic, underline, strikethrough',
            'Bullet point and numbered lists',
            'Character counter',
            'Free to use',
        ],
        'screenshot': `${site.url}/images/og/og.png`,
        'provider': {
            '@id': `${site.url}/#organization`,
        },
    }

    return (
        <>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
            <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />

            <div className='max-w-content border-border mx-auto border-x'>
                <Hero />
                <Tool />
                <HowToUse />
            </div>

            <OpenSource />

            <div className='max-w-content border-border mx-auto border-x'>
                <Reason />
                <Features />
                <EmbedSection />
                <FAQs />
            </div>

            <CtaSection />
        </>
    )
}
