'use client'

import { useState } from 'react'
import { ImageIcon } from 'lucide-react'

import type { OgPreviewData } from '@/lib/link-preview/types'
import { cn } from '@/lib/utils'

interface LinkCardProps {
    data: OgPreviewData
    variant: 'desktop' | 'mobile'
}

function displayDomain(data: OgPreviewData): string {
    const source = data.finalUrl || data.requestedUrl
    try {
        return new URL(source).hostname.replace(/^www\./, '').toLowerCase()
    } catch {
        return source.toLowerCase()
    }
}

// Matches LinkedIn's current default link card for shared links: a horizontal
// card with a small square thumbnail on the left and the title above the
// lowercase domain on the right.
export function LinkCard({ data, variant }: LinkCardProps) {
    const [imageOk, setImageOk] = useState(true)
    const isMobile = variant === 'mobile'
    const domain = displayDomain(data)
    const title = data.title || data.requestedUrl

    return (
        <div
            className={cn(
                'border-border flex items-stretch overflow-hidden rounded-md border bg-white',
                isMobile ? 'w-full max-w-[340px]' : 'w-full max-w-[552px]',
            )}>
            <div className={cn('relative shrink-0 bg-neutral-100', isMobile ? 'size-24' : 'size-32')}>
                {data.imageUrl && imageOk ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={data.imageUrl}
                        alt=''
                        referrerPolicy='no-referrer'
                        onError={() => setImageOk(false)}
                        className='size-full object-cover'
                    />
                ) : (
                    <div className='flex size-full items-center justify-center text-neutral-400'>
                        <ImageIcon className={isMobile ? 'size-6' : 'size-8'} />
                    </div>
                )}
            </div>

            <div className={cn('flex min-w-0 flex-col justify-center gap-1', isMobile ? 'px-3 py-2' : 'px-4 py-3')}>
                <p
                    className={cn(
                        'line-clamp-2 font-semibold text-neutral-900',
                        isMobile ? 'text-sm leading-snug' : 'text-[15px] leading-snug',
                    )}>
                    {title}
                </p>
                <p className={cn('truncate text-neutral-500', isMobile ? 'text-xs' : 'text-[13px]')}>{domain}</p>
            </div>
        </div>
    )
}
