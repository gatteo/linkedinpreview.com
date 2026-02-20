'use client'

import React from 'react'
import {
    IconBrandLinkedin,
    IconBrandTelegram,
    IconBrandTwitter,
    IconBrandWhatsapp,
    IconMail,
} from '@tabler/icons-react'
import { Check, Copy } from 'lucide-react'
import posthog from 'posthog-js'
import {
    EmailShareButton,
    LinkedinShareButton,
    TelegramShareButton,
    TwitterShareButton,
    WhatsappShareButton,
} from 'react-share'

import { buttonVariants } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Separator } from '../ui/separator'

const SHARE_TITLE = 'Check out this LinkedIn post draft'

export function ShareDialog({
    url,
    open,
    onOpenChange,
}: {
    url: string
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const trackShare = (platform: string) => {
        posthog.capture('draft_shared', { platform })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Share this draft</DialogTitle>
                    <DialogDescription>
                        Anyone with the link can view and edit a copy of your formatted post.
                    </DialogDescription>
                </DialogHeader>

                <div className='flex items-center gap-2'>
                    <Input readOnly value={url} className='truncate text-sm' />
                    <button
                        type='button'
                        onClick={handleCopy}
                        className={buttonVariants({ size: 'icon', variant: 'outline' }) + ' shrink-0'}>
                        {copied ? <Check className='size-4 text-green-600' /> : <Copy className='size-4' />}
                    </button>
                </div>

                <Separator />

                <div className='flex items-center gap-3'>
                    <p className='shrink-0 text-sm font-medium text-muted-foreground'>Share via</p>
                    <div className='flex gap-2'>
                        <EmailShareButton url={url} subject={SHARE_TITLE} onClick={() => trackShare('email')}>
                            <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                                <IconMail className='size-4' />
                            </div>
                        </EmailShareButton>
                        <LinkedinShareButton url={url} title={SHARE_TITLE} onClick={() => trackShare('linkedin')}>
                            <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                                <IconBrandLinkedin className='size-4' />
                            </div>
                        </LinkedinShareButton>
                        <TelegramShareButton url={url} title={SHARE_TITLE} onClick={() => trackShare('telegram')}>
                            <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                                <IconBrandTelegram className='size-4' />
                            </div>
                        </TelegramShareButton>
                        <TwitterShareButton url={url} title={SHARE_TITLE} onClick={() => trackShare('twitter')}>
                            <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                                <IconBrandTwitter className='size-4' />
                            </div>
                        </TwitterShareButton>
                        <WhatsappShareButton url={url} title={SHARE_TITLE} onClick={() => trackShare('whatsapp')}>
                            <div className={buttonVariants({ size: 'icon', variant: 'outline' })}>
                                <IconBrandWhatsapp className='size-4' />
                            </div>
                        </WhatsappShareButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
