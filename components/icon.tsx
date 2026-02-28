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
    Share2,
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
        <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor' {...props}>
            <path d='M14 2L0 6.67l5 2.64 5.67-3.98L6.7 11l2.63 5L14 2z' />
        </svg>
    ),
    linkedInRepost: ({ ...props }: LucideProps) => (
        <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor' {...props}>
            <path d='M4 10H2V5c0-1.66 1.34-3 3-3h3.85L7.42 0h2.44L12 3 9.86 6H7.42l1.43-2H5c-.55 0-1 .45-1 1v5zm8-4v5c0 .55-.45 1-1 1H7.15l1.43-2H6.14L4 13l2.14 3h2.44l-1.43-2H11c1.66 0 3-1.34 3-3V6h-2z' />
        </svg>
    ),
    linkedInComment: ({ ...props }: LucideProps) => (
        <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor' {...props}>
            <path d='M5 8h5v1H5zm11-.5v.08a6 6 0 01-2.75 5L8 16v-3H5.5A5.51 5.51 0 010 7.5 5.62 5.62 0 015.74 2h4.76A5.5 5.5 0 0116 7.5zm-2 0A3.5 3.5 0 0010.5 4H5.74A3.62 3.62 0 002 7.5 3.53 3.53 0 005.5 11H10v1.33l2.17-1.39A4 4 0 0014 7.58zM5 7h6V6H5z' />
        </svg>
    ),
    linkedInLike: ({ ...props }: LucideProps) => (
        <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor' {...props}>
            <path d='M12.91 7l-2.25-2.57a8.21 8.21 0 01-1.5-2.55L9 1.37A2.08 2.08 0 007 0a2.08 2.08 0 00-2.06 2.08v1.17a5.81 5.81 0 00.31 1.89l.28.86H2.38A1.47 1.47 0 001 7.47a1.45 1.45 0 00.64 1.21 1.48 1.48 0 00-.37 2.06 1.54 1.54 0 00.62.51h.05a1.6 1.6 0 00-.19.71A1.47 1.47 0 003 13.42v.1A1.46 1.46 0 004.4 15h4.83a5.61 5.61 0 002.48-.58l1-.42H14V7zM12 12.11l-1.19.52a3.59 3.59 0 01-1.58.37H5.1a.55.55 0 01-.53-.4l-.14-.48-.49-.21a.56.56 0 01-.34-.6l.09-.56-.42-.42a.56.56 0 01-.09-.68L3.55 9l-.4-.61A.28.28 0 013.3 8h5L7.14 4.51a4.15 4.15 0 01-.2-1.26V2.08A.09.09 0 017 2a.11.11 0 01.08 0l.18.51a10 10 0 001.9 3.24l2.84 3z' />
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
    share: Share2,

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
