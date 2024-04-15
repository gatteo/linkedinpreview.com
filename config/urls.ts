import type {
    ContactLinks as ContactLinksT,
    FooterLinkGroups as FooterLinkGroupsT,
    HeaderLinks as HeaderLinksT,
    SocialLinks as SocialLinksT,
} from '@/types/urls'

import { Routes } from './routes'

export const UtmSource = 'linkedinpreview.com'

export const ExternalLinks = {
    GitHub: 'https://github.com/gatteo/linkedinpreview.com',
}

export const HeaderLinks: HeaderLinksT = [
    {
        icon: 'learningProductsPage',
        href: Routes.HowItWorks,
        text: 'How it works',
    },
    {
        icon: 'servicesPage',
        href: Routes.AllFeatures,
        text: 'Features',
    },
    {
        icon: 'projectsPage',
        href: Routes.Faqs,
        text: 'FAQ',
    },
    {
        icon: 'blogPage',
        href: Routes.Blog,
        text: 'Blog & Guides',
    },
]

export const FooterLinkGroups: FooterLinkGroupsT = [
    {
        id: 2,
        links: [
            {
                href: Routes.AllFeatures,
                title: 'AllFeatures',
            },
            {
                href: Routes.HowItWorks,
                title: 'How it works',
            },
            {
                href: Routes.Faqs,
                title: 'FAQs',
            },
            {
                href: Routes.Blog,
                title: 'Blog',
            },
        ],
    },
]

export const AuthorSocialLinks: SocialLinksT = [
    {
        name: 'instagram',
        url: 'https://www.instagram.com/mattegiardino',
        handle: '@mattegiardino',
        icon: 'instagram',
    },
    {
        name: 'tiktok',
        url: 'https://www.tiktok.com/@mattegiardino',
        handle: '@mattegiardino',
        icon: 'tiktok',
    },
    {
        name: 'github',
        url: 'https://github.com/gatteo',
        handle: '@gatteo',
        icon: 'github',
    },
    {
        name: 'linkedin',
        url: 'https://www.linkedin.com/in/matteo-giardino',
        handle: '@matteo-giardino',
        icon: 'linkedin',
    },
    {
        name: 'x',
        url: 'https://twitter.com/mattegiardino',
        handle: '@mattegiardino',
        icon: 'twitter',
    },
    {
        name: 'twitch',
        url: 'https://www.twitch.tv/matteogiardino',
        handle: '@matteogiardino',
        icon: 'twitch',
    },
]

export const AuthorContactLinks: ContactLinksT = [
    {
        name: 'Personal',
        mailto: 'hi@matteogiardino.com',
        icon: 'email',
        logo: '/images/mg-logo-white.webp',
    },
    {
        name: 'Wezard',
        mailto: 'matteo@wezard.it',
        icon: 'email',
        logo: '/images/brands/wezard-icon.png',
    },
]
