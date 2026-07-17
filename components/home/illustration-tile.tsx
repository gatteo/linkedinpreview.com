import { type ReactNode } from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

/**
 * The signature "sticker" illustration: a rounded, ringed, grain-topped image
 * tile (one warm vermilion subject on a cool petrol field) with an optional
 * bottom-scrim caption. The .sticker class (globals.css) carries the inset ring,
 * layered shadow and grain overlay.
 */
export function IllustrationTile({
    src,
    alt = '',
    ratio = '4 / 3',
    eyebrow,
    title,
    subtitle,
    priority,
    className,
}: {
    src: string
    alt?: string
    ratio?: string
    eyebrow?: ReactNode
    title?: ReactNode
    subtitle?: ReactNode
    priority?: boolean
    className?: string
}) {
    const hasCaption = Boolean(eyebrow || title || subtitle)
    return (
        <figure className={cn('sticker m-0', className)} style={{ aspectRatio: ratio }}>
            <Image src={src} alt={alt} fill priority={priority} sizes='(max-width: 980px) 100vw, 50vw' />
            {hasCaption && (
                <figcaption className='absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[oklch(0.16_0.03_222_/_0.86)] via-[oklch(0.16_0.03_222_/_0.35)] to-transparent p-5 pt-16 text-[oklch(0.98_0.01_90)]'>
                    {eyebrow && (
                        <p className='tracking-label font-mono text-[11px] font-medium text-[color:var(--orange-200)] uppercase'>
                            {eyebrow}
                        </p>
                    )}
                    {title && <p className='font-heading mt-1.5 text-lg font-semibold tracking-[-0.01em]'>{title}</p>}
                    {subtitle && <p className='mt-1 text-[13px] leading-snug text-white/70'>{subtitle}</p>}
                </figcaption>
            )}
        </figure>
    )
}
