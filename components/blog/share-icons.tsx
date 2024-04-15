'use client'

import {
    IconBrandLinkedin,
    IconBrandTelegram,
    IconBrandTwitter,
    IconBrandWhatsapp,
    IconMail,
} from '@tabler/icons-react'
import {
    EmailShareButton,
    LinkedinShareButton,
    TelegramShareButton,
    TwitterShareButton,
    WhatsappShareButton,
} from 'react-share'

import { cn } from '@/lib/utils'

import { buttonVariants } from '../ui/button'

export function ShareIcons({ url, title, className }: { url: string; title: string; className?: string }) {
    return (
        <div className={cn('flex justify-center gap-2', className)}>
            <EmailShareButton url={url} subject={title} body={'Leggi questo post di Matteo Giardino, ne vale la pena!'}>
                <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                    <IconMail className='size-4' />
                </div>
            </EmailShareButton>
            <LinkedinShareButton
                url={url}
                title={title}
                summary={'Leggi questo post di Matteo Giardino, ne vale la pena!'}
                source={'Matteo Giardino'}>
                <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                    <IconBrandLinkedin className='size-4' />
                </div>
            </LinkedinShareButton>
            <TelegramShareButton url={url} title={title}>
                <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                    <IconBrandTelegram className='size-4' />
                </div>
            </TelegramShareButton>
            <TwitterShareButton title={title} url={url}>
                <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                    <IconBrandTwitter className='size-4' />
                </div>
            </TwitterShareButton>
            <WhatsappShareButton title={title} url={url}>
                <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                    <IconBrandWhatsapp className='size-4' />
                </div>
            </WhatsappShareButton>
        </div>
    )
}
