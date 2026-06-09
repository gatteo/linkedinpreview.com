import { Icons } from '@/components/icon'

export type HeaderLinks = {
    icon: keyof typeof Icons
    href: string
    text: string
}[]

export enum UtmMediums {
    Blog = 'blog',
    Homepage = 'home',
}
