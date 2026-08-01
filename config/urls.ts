import type { HeaderLinks as HeaderLinksT } from '@/types/urls'

import { Routes } from './routes'

export const UtmSource = 'linkedinpreview.com'

export const ExternalLinks = {
    GitHub: 'https://github.com/gatteo/linkedinpreview.com',
}

export const HeaderLinks: HeaderLinksT = [
    {
        icon: 'preview',
        href: Routes.Tool,
        text: 'Use Tool',
    },
    {
        icon: 'howItWorks',
        href: Routes.HowItWorks,
        text: 'How it works',
    },
    {
        icon: 'servicesPage',
        href: Routes.AllFeatures,
        text: 'Features',
    },
    {
        icon: 'faq',
        href: Routes.Faqs,
        text: 'FAQ',
    },
    {
        icon: 'blogPage',
        href: Routes.Blog,
        text: 'Blog & Guides',
    },
    {
        icon: 'changelog',
        href: Routes.Changelog,
        text: 'Changelog',
    },
]
