'use client'

import {
    IconBrandLinkedin,
    IconBrandTelegram,
    IconBrandTwitter,
    IconBrandWhatsapp,
    IconMail,
} from '@tabler/icons-react'
import posthog from 'posthog-js'
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
    const trackShare = (platform: string) => {
        posthog.capture('blog_article_shared', {
            platform,
            article_url: url,
            article_title: title,
        })
    }

    return (
        <div className={cn('flex justify-center gap-2', className)}>
            <EmailShareButton
                url={url}
                subject={title}
                body={'Leggi questo post di Matteo Giardino, ne vale la pena!'}
                onClick={() => trackShare('email')}>
                <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                    <IconMail className='size-4' />
                </div>
            </EmailShareButton>
            <LinkedinShareButton
                url={url}
                title={title}
                summary={'Leggi questo post di Matteo Giardino, ne vale la pena!'}
                source={'Matteo Giardino'}
                onClick={() => trackShare('linkedin')}>
                <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                    <IconBrandLinkedin className='size-4' />
                </div>
            </LinkedinShareButton>
            <TelegramShareButton url={url} title={title} onClick={() => trackShare('telegram')}>
                <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                    <IconBrandTelegram className='size-4' />
                </div>
            </TelegramShareButton>
            <TwitterShareButton title={title} url={url} onClick={() => trackShare('twitter')}>
                <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                    <IconBrandTwitter className='size-4' />
                </div>
            </TwitterShareButton>
            <WhatsappShareButton title={title} url={url} onClick={() => trackShare('whatsapp')}>
                <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                    <IconBrandWhatsapp className='size-4' />
                </div>
            </WhatsappShareButton>
        </div>
    )
}
