'use client'

// ---------------------------------------------------------------------------
// CarouselFeedPreview shows how a carousel document will look once posted to
// the LinkedIn feed: a realistic post card (author header + caption) wrapping
// the LinkedIn DOCUMENT viewer. The viewer renders the current slide via the
// shared SlideArtboard, scaled to fit the card width, with LinkedIn's dark
// document chrome overlaid - a title bar, left/right page arrows, and a bottom
// slide counter. Slides are paged through with internal state.
//
// The scaled artboard wrapper is dynamic canvas geometry (a computed scale
// applied to a fixed-pixel artboard), so inline sizing styles are used there -
// the same documented exception that SlideArtboard relies on.
// ---------------------------------------------------------------------------
import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { carouselTitle } from '@/lib/carousel/serialize'
import { resolveTheme } from '@/lib/carousel/theme'
import { type CarouselDocument } from '@/lib/carousel/types'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/icon'

import { SlideArtboard } from './slide-artboard'

type Author = {
    name: string
    headline: string
    avatarUrl: string
}

type Props = {
    doc: CarouselDocument
    author: Author
    caption?: string
}

// Width the post card renders the document viewer at (px). The artboard is
// scaled down from its canvas width to this so it fits the feed card.
const CARD_WIDTH = 504

export function CarouselFeedPreview({ doc, author, caption }: Props) {
    const theme = React.useMemo(() => resolveTheme(doc.themeId, doc.themeOverrides), [doc.themeId, doc.themeOverrides])
    const total = doc.slides.length
    const [index, setIndex] = React.useState(0)

    // Clamp the active slide if the deck shrinks underneath us.
    const safeIndex = Math.min(index, Math.max(total - 1, 0))
    const slide = doc.slides[safeIndex]

    const goPrev = () => setIndex((i) => Math.max(0, Math.min(i, total - 1) - 1))
    const goNext = () => setIndex((i) => Math.min(total - 1, i + 1))

    const scale = CARD_WIDTH / doc.canvas.width
    const scaledHeight = doc.canvas.height * scale

    const title = carouselTitle(doc)

    return (
        <div className='font-system overflow-hidden rounded-lg border border-black/8 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]'>
            <div className='px-4 pt-3 pb-1'>
                <div className='flex items-center gap-3'>
                    <span className='relative inline-block shrink-0'>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt='' className='size-12 rounded-full object-cover' src={author.avatarUrl} />
                        <span className='absolute right-0 bottom-0 inline-flex size-4 items-center justify-center rounded-full bg-[#1052B8] text-white ring-2 ring-white'>
                            <Icon name='linkedinLogo' className='size-2.5' />
                        </span>
                    </span>
                    <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-semibold text-neutral-900'>{author.name}</p>
                        <p className='truncate text-xs font-normal text-neutral-500'>{author.headline}</p>
                        <div className='flex items-center gap-1'>
                            <span className='text-xs font-normal text-neutral-500'>Now</span>
                            <span className='text-xs font-normal text-neutral-500'>•</span>
                            <Icon name='linkedInVisibility' className='size-3.5 text-neutral-500' />
                        </div>
                    </div>
                </div>

                {caption?.trim() ? (
                    <p className='mt-2 text-sm whitespace-pre-wrap text-neutral-800'>{caption}</p>
                ) : null}
            </div>

            {/* LinkedIn document viewer */}
            {slide ? (
                <div className='relative w-full overflow-hidden bg-[#1B1F23]' style={{ height: scaledHeight }}>
                    <div className='origin-top-left' style={{ width: doc.canvas.width, transform: `scale(${scale})` }}>
                        <SlideArtboard slide={slide} doc={doc} theme={theme} index={safeIndex} total={total} />
                    </div>

                    {/* Title bar overlay (top) */}
                    <div className='pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/55 to-transparent px-3 pt-2.5 pb-6'>
                        <p className='line-clamp-2 text-sm font-semibold text-white/95'>{title}</p>
                    </div>

                    {/* Page arrows */}
                    {safeIndex > 0 ? (
                        <button
                            type='button'
                            aria-label='Previous slide'
                            onClick={goPrev}
                            className='absolute top-1/2 left-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none'>
                            <ChevronLeft className='size-5' />
                        </button>
                    ) : null}
                    {safeIndex < total - 1 ? (
                        <button
                            type='button'
                            aria-label='Next slide'
                            onClick={goNext}
                            className='absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none'>
                            <ChevronRight className='size-5' />
                        </button>
                    ) : null}

                    {/* Bottom bar with slide counter */}
                    <div className='pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/55 to-transparent px-3 pt-6 pb-2.5'>
                        <span className='line-clamp-1 text-xs font-medium text-white/85'>{title}</span>
                        <span className='shrink-0 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white tabular-nums'>
                            {safeIndex + 1}/{total}
                        </span>
                    </div>
                </div>
            ) : null}

            {/* Action buttons */}
            <div className='px-4 py-2'>
                <hr className='border-neutral-200' />
                <div className='mt-2 flex items-center justify-around'>
                    {(['Like', 'Comment', 'Repost', 'Send'] as const).map((action) => (
                        <div
                            key={action}
                            className={cn(
                                'flex flex-row items-center justify-center gap-1.5 rounded-lg px-1.5 py-2 text-xs font-semibold text-[#666] hover:bg-neutral-100',
                            )}>
                            <Icon name={`linkedIn${action}`} className='size-4' />
                            <span>{action}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
