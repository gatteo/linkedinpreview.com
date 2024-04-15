import React from 'react'
import {
    IconBrandGithub,
    IconBrandInstagram,
    IconBrandLinkedin,
    IconBrandTiktok,
    IconBrandTwitch,
    IconBrandTwitter,
    IconDeviceDesktop,
    IconFlame,
    IconInfoSquareRounded,
    IconListDetails,
    IconMenu,
    IconMessageCircle,
    IconPencil,
    IconSchool,
    IconSeeding,
    IconStars,
} from '@tabler/icons-react'
import {
    Bold,
    CheckCircle,
    Clipboard,
    DollarSign,
    GalleryHorizontalEnd,
    Image,
    Italic,
    List,
    ListOrdered,
    Loader2,
    LucideProps,
    MessageCircleHeart,
    RemoveFormatting,
    ScanEye,
    Smile,
    StarIcon,
    Strikethrough,
    ThumbsUp,
    Underline,
    Wand,
    type LucideIcon,
} from 'lucide-react'
import { EmailIcon } from 'react-share'

export const Icons = {
    menu: IconMenu,
    star: StarIcon,
    emoji: Smile,
    image: Image,
    carousel: GalleryHorizontalEnd,
    magic: Wand,
    copy: Clipboard,
    spinner: Loader2,

    checkCircle: CheckCircle,
    thumsUp: ThumbsUp,
    commentHeart: MessageCircleHeart,

    linkedInSend: ({ ...props }: LucideProps) => (
        <svg
            aria-hidden='true'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 26 26'
            {...props}>
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M21.354 3.644 2.43 8.98a.812.812 0 0 0-.128 1.517l8.695 4.118c.17.08.306.217.387.387l4.118 8.695a.812.812 0 0 0 1.517-.128l5.337-18.924a.813.813 0 0 0-1.002-1.002ZM11.26 14.74l4.596-4.596'></path>
        </svg>
    ),
    linkedInShare: ({ ...props }: LucideProps) => (
        <svg
            aria-hidden='true'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 26 26'
            {...props}>
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='m18.208 15.438 4.875-4.876-4.875-4.874'></path>
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M3.583 20.313a9.75 9.75 0 0 1 9.75-9.75h9.75'></path>
        </svg>
    ),
    linkedInComment: ({ ...props }: LucideProps) => (
        <svg
            aria-hidden='true'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 26 26'
            {...props}>
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M5.28 17.976a9.746 9.746 0 1 1 3.41 3.41h0l-3.367.962a.813.813 0 0 1-1.005-1.004l.963-3.368h0ZM10.417 11.375h6.5M10.417 14.625h6.5'></path>
        </svg>
    ),
    linkedInLike: ({ ...props }: LucideProps) => (
        <svg
            aria-hidden='true'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 26 26'
            {...props}>
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M22.75 10.563h-4.874v10.562h4.875a.812.812 0 0 0 .812-.813v-8.937a.812.812 0 0 0-.812-.813v0Z'></path>
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='m17.876 10.563-4.063-8.126a3.25 3.25 0 0 0-3.25 3.25v2.438H4.28a1.625 1.625 0 0 0-1.613 1.827l1.22 9.75a1.625 1.625 0 0 0 1.612 1.423h12.378'></path>
        </svg>
    ),
    linkedInVisibility: ({ ...props }: LucideProps) => (
        <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' {...props}>
            <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z'
                clipRule='evenodd'></path>
        </svg>
    ),
    linkedinLogo: ({ ...props }: LucideProps) => (
        <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' {...props}>
            <circle cx='4.983' cy='5.009' r='2.188'></circle>
            <path d='M9.237 8.855v12.139h3.769v-6.003c0-1.584.298-3.118 2.262-3.118 1.937 0 1.961 1.811 1.961 3.218v5.904H21v-6.657c0-3.27-.704-5.783-4.526-5.783-1.835 0-3.065 1.007-3.568 1.96h-.051v-1.66H9.237zm-6.142 0H6.87v12.139H3.095z'></path>
        </svg>
    ),

    mobile: ({ ...props }: LucideProps) => (
        <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24' {...props}>
            <path
                fillRule='evenodd'
                d='M6.709 0H17.29a1.326 1.326 0 0 1 1.324 1.323v21.354a1.326 1.326 0 0 1-1.323 1.324H6.708a1.327 1.327 0 0 1-1.324-1.324V1.323A1.326 1.326 0 0 1 6.71 0Zm4.112 21.883h2.359a.544.544 0 0 1 0 1.086H10.82a.545.545 0 0 1-.543-.543c0-.299.245-.543.543-.543Zm-4.234-1.032h10.826V3.15H6.587V20.85ZM16.89 1.308a.267.267 0 0 0 0 .533h.03a.267.267 0 0 0 0-.533h-.03Zm-9.812 0a.267.267 0 0 0 0 .533h.03a.267.267 0 0 0 0-.533h-.03Zm3.41 0h3.023v.533h-3.024v-.533Z'
                clipRule='evenodd'></path>
        </svg>
    ),
    tablet: ({ ...props }: LucideProps) => (
        <svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24' {...props}>
            <path
                fillRule='evenodd'
                d='M4.245 0h15.51a1.477 1.477 0 0 1 1.472 1.473v21.055A1.477 1.477 0 0 1 19.755 24H4.245a1.477 1.477 0 0 1-1.472-1.473V1.473A1.477 1.477 0 0 1 4.245 0Zm6.542 22.4h2.426v.534h-2.426V22.4Zm.618-21.335a.267.267 0 1 0 0 .533.267.267 0 0 0 0-.533Zm1.19 0a.267.267 0 1 0 0 .533.267.267 0 0 0 0-.533Zm-8.263 1.6h15.336v18.67H4.332V2.666Z'
                clipRule='evenodd'></path>
        </svg>
    ),
    desktop: ({ ...props }: LucideProps) => (
        <svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 24 24' {...props}>
            <path
                fillRule='evenodd'
                d='M1.503 2C.676 2 0 2.677 0 3.503v12.471c0 .827.676 1.503 1.503 1.503h20.994c.827 0 1.503-.676 1.503-1.503V3.503C24 2.676 23.324 2 22.497 2H1.503Zm20.671 1.777a.214.214 0 0 1 .21.21V15.13H1.615V3.988a.214.214 0 0 1 .21-.21h20.35Z'
                clipRule='evenodd'></path>
            <path fillRule='evenodd' d='M13.835 20.61v-3.295h-3.67v3.296h3.67Z' clipRule='evenodd'></path>
            <path
                fillRule='evenodd'
                d='M18.353 21.49c0-.572-.469-1.04-1.041-1.04H6.688c-.572 0-1.04.468-1.04 1.04v1.042h12.705V21.49Z'
                clipRule='evenodd'></path>
        </svg>
    ),

    bold: Bold,
    strikethrough: Strikethrough,
    underline: Underline,
    italic: Italic,
    bulletList: List,
    numberedList: ListOrdered,

    formatting: RemoveFormatting,
    preview: ScanEye,
    dollar: DollarSign,

    instagram: IconBrandInstagram,
    tiktok: IconBrandTiktok,
    github: IconBrandGithub,
    linkedin: IconBrandLinkedin,
    twitter: IconBrandTwitter,
    twitch: IconBrandTwitch,
    email: EmailIcon,

    servicesPage: IconDeviceDesktop,
    learningProductsPage: IconSeeding,
    projectsPage: IconFlame,
    contactsPage: IconMessageCircle,
    blogPage: IconPencil,

    plWhatIsSection: IconInfoSquareRounded,
    plIsForYouSection: IconFlame,
    plWhatIsIncludedSection: IconListDetails,
    plTestimonialsSection: IconStars,

    tclWhatIsSection: IconInfoSquareRounded,
    tclMentorSection: IconSchool,
    tclIsForYouSection: IconFlame,
    tclWhatIsIncludedSection: IconListDetails,
}

export const Icon = React.forwardRef<
    React.ElementRef<LucideIcon>,
    React.ComponentPropsWithoutRef<LucideIcon> & {
        name: keyof typeof Icons
    }
>(({ name, className, ...props }, ref) => {
    // Assuming the icon name is valid
    const IconComponent = Icons[name]

    if (!IconComponent) {
        console.error(`Icon '${name}' not found.`)
        return null
    }

    return <IconComponent ref={ref} className={className} {...props} />
})

Icon.displayName = 'Icon'
