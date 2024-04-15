import { Metadata } from 'next'

type Site = {
    title: string
    description: string
    url: string
    logo: string
}

export const site: Site = {
    title: 'LinkedIn Post Preview',
    description:
        'A free online tool to write, format, and preview your LinkedIn posts before publishing them. Add bold, italic, and emoji to your LinkedIn posts, and see how they look on desktop and mobile.',
    url: process.env.NODE_ENV === 'production' ? 'https://linkedinpreview.com' : 'http://localhost:3000',
    logo: 'https://linkedinpreview.com/images/logo-rounded-rectangle.png',
}

export const siteBaseMetadata: Metadata = {
    title: site.title,
    description: site.description,
    applicationName: 'LinkedIn Post Preview',
    referrer: 'origin-when-cross-origin',
    keywords: [
        'Matteo Giardino',
        'LinkedIn',
        'LinkedIn Post Preview',
        'LinkedIn Post Formatting',
        'LinkedIn Bold Text',
        'LinkedIn Italic Text',
        'LinkedIn Preview Mobile',
        'LinkedIn Post Simulator',
    ],
    authors: [{ name: 'Matteo Giardino', url: 'https://matteogiardino.com' }],
    creator: 'Matteo Giardino',
    publisher: 'Matteo Giardino',
    formatDetection: {
        email: true,
        address: true,
        telephone: true,
    },
    openGraph: {
        url: site.url,
        type: 'website',
        title: site.title,
        siteName: site.title,
        description: site.description,
        locale: 'it-IT',
        images: [
            {
                url: `${site.url}/images/og/og.png`,
                width: 1200,
                height: 630,
                alt: site.description,
                type: 'image/png',
            },
        ],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            'index': true,
            'follow': true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: '/images/favicon/favicon.ico',
        shortcut: '/images/favicon/favicon.ico',
        apple: [
            {
                url: '/images/favicon/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
        other: [
            {
                rel: 'icon',
                type: 'image/png',
                sizes: '16x16',
                url: '/images/favicon/favicon-16x16.png',
            },
            {
                rel: 'icon',
                type: 'image/png',
                sizes: '32x32',
                url: '/images/favicon/favicon-32x32.png',
            },
        ],
    },
    manifest: '/images/favicon/site.webmanifest',
    twitter: {
        card: 'summary_large_image',
        title: site.title,
        description: site.description,
        site: '@mattegiardino',
        creator: '@mattegiardino',
        images: [
            {
                url: `${site.url}/images/og/og.png`,
                width: 1200,
                height: 630,
                alt: site.description,
            },
        ],
    },
    // verification: {
    //     google: 'google-site-verification-id',
    // },
    alternates: {
        canonical: site.url,
        // languages: {
        //     'en-US': 'https://linkedinpreview.com/en-US',
        // },
        types: {
            'application/rss+xml': `${site.url}/rss.xml`,
        },
    },
    category: 'technology',
}
