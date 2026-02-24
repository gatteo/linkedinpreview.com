import Link from 'next/link'
import { UtmUrl } from '@/utils/urls'

import { UtmMediums } from '@/types/urls'
import { cn, shineAnimation } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

import { TrackClick } from './tracking/track-click'

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
    return (
        <Card className={cn('w-full not-prose overflow-hidden rounded-xl border-border shadow-subtle', shineAnimation)}>
            <div className='relative'>
                <div
                    className={cn(
                        'relative z-10 flex flex-col gap-4 p-6',
                        align === 'center' && 'items-center justify-center',
                    )}>
                    <div className={cn('text-balance', align === 'center' && 'text-center')}>
                        <CardTitle className='font-heading tracking-wide'>{title}</CardTitle>
                        <CardDescription className='mt-2'>{description}</CardDescription>
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
                                button_text: primaryButtonText,
                                button_url: primaryButtonUrl,
                                card_title: title,
                            }}>
                            <Button asChild>
                                <Link
                                    href={UtmUrl(primaryButtonUrl, {
                                        medium: UtmMediums.Blog,
                                        content: 'card_cta',
                                    })}>
                                    {primaryButtonText}
                                </Link>
                            </Button>
                        </TrackClick>
                    </div>
                </div>

                <div className='absolute inset-0 bg-background/5' />

                <div
                    className='absolute inset-0 bg-cover bg-center opacity-5'
                    style={{ backgroundImage: `url('/images/patterns/${pattern}.png')` }}
                />
            </div>
        </Card>
    )
}
