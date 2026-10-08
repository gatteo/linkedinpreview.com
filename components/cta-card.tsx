'use client'

import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UtmUrl } from '@/utils/urls'

import { UtmMediums } from '@/types/urls'
import { articleToolEntry } from '@/config/article-tool-entries'
import { cn, shineAnimation } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { TrackClick } from '@/components/tracking/track-click'

const ArticleTool = dynamic(() => import('@/components/tool/tool').then((mod) => mod.Tool), {
    loading: () => (
        <p className='p-6' role='status'>
            Loading the free editor...
        </p>
    ),
    ssr: false,
})

type Props = {
    title: string
    description: string
    primaryButtonText: string
    primaryButtonUrl: string
    secondaryButtonText?: string
    secondaryButtonUrl?: string
    pattern?: string
    align?: 'left' | 'center' | 'right'
}

export function CtaCard({
    title,
    description,
    primaryButtonText,
    primaryButtonUrl,
    secondaryButtonText,
    secondaryButtonUrl,
    pattern = 'circles',
    align = 'center',
}: Props) {
    const entry = articleToolEntry(usePathname(), title)
    const [opened, setOpened] = useState(false)
    const toolId = useId()
    const toolRef = useRef<HTMLDivElement>(null)
    const buttonText = entry?.buttonText ?? primaryButtonText

    useEffect(() => {
        if (opened) toolRef.current?.focus({ preventScroll: true })
    }, [opened])

    function openTool(event: MouseEvent<HTMLAnchorElement>) {
        if (
            !entry ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        )
            return
        event.preventDefault()
        setOpened(true)
    }

    return (
        <Card
            className={cn(
                'not-prose border-border shadow-subtle w-full overflow-hidden rounded-xl p-0',
                shineAnimation,
            )}>
            <div className='relative'>
                <div
                    className={cn(
                        'relative z-10 flex flex-col gap-4 p-6',
                        align === 'center' && 'items-center justify-center',
                    )}>
                    <div className={cn('text-balance', align === 'center' && 'text-center')}>
                        <CardTitle className='font-heading tracking-wide'>{title}</CardTitle>
                        <CardDescription className='mt-2'>{description}</CardDescription>
                        {entry && <p className='text-muted-foreground mt-2 text-sm'>{entry.supportingCopy}</p>}
                    </div>
                    <div className='flex gap-4'>
                        {secondaryButtonText && secondaryButtonUrl && (
                            <TrackClick
                                event='cta_card_clicked'
                                properties={{
                                    button_type: 'secondary',
                                    button_text: secondaryButtonText,
                                    button_url: secondaryButtonUrl,
                                    card_title: title,
                                }}>
                                <Button variant='outline' asChild>
                                    <Link
                                        href={UtmUrl(secondaryButtonUrl, {
                                            medium: UtmMediums.Blog,
                                            content: 'card_cta',
                                        })}>
                                        {secondaryButtonText}
                                    </Link>
                                </Button>
                            </TrackClick>
                        )}
                        <TrackClick
                            event='cta_card_clicked'
                            properties={{
                                button_type: 'primary',
                                button_text: buttonText,
                                button_url: primaryButtonUrl,
                                card_title: title,
                            }}>
                            <Button asChild>
                                <Link
                                    onClick={openTool}
                                    aria-expanded={entry ? opened : undefined}
                                    aria-controls={entry ? toolId : undefined}
                                    prefetch={entry ? false : undefined}
                                    href={UtmUrl(primaryButtonUrl, {
                                        medium: UtmMediums.Blog,
                                        content: 'card_cta',
                                    })}>
                                    {buttonText}
                                </Link>
                            </Button>
                        </TrackClick>
                    </div>
                </div>

                <div className='bg-background/5 absolute inset-0' />

                <div
                    className='absolute inset-0 bg-cover bg-center opacity-5'
                    style={{ backgroundImage: `url('/images/patterns/${pattern}.png')` }}
                />
            </div>
            {entry && opened && (
                <div
                    id={toolId}
                    ref={toolRef}
                    tabIndex={-1}
                    role='region'
                    aria-label={entry.buttonText}
                    data-article-tool={entry.pathname}
                    className='min-w-0 outline-none [&>section>div]:border-0 [&>section>div]:py-6 [&>section>div]:sm:px-4'>
                    <ArticleTool layout='tabs' />
                </div>
            )}
        </Card>
    )
}
