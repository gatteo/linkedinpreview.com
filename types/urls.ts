import { Icons } from '@/components/icon'

export type HeaderLinks = {
    icon: keyof typeof Icons
    href: string
    text: string
}[]

export type FooterLinkGroups = {
    id: number
    label?: string
    links: {
        href: string
        title: string
    }[]
}[]

export type SocialLinks = {
    name: string
    url: string
    handle: string
    icon: keyof typeof Icons
}[]

export type ContactLinks = {
    name: string
    mailto: string
    icon: keyof typeof Icons
    logo: string
}[]

export enum UtmMediums {
    Navbar = 'navbar',
    Hero = 'hero',
    Features = 'features',
    HowItWorks = 'how_it_works',
    Faqs = 'faqs',

    Blog = 'blog',
    Homepage = 'home',
    Projects = 'projects',
    Services = 'services',
    LearningProducts = 'learning_products',
    NotFound = 'not_found',

    Embed = 'embed',
    Footer = 'footer',
    NotificationPopup = 'notification_popup',
}
