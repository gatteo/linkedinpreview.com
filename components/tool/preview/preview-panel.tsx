import type React from 'react'
import { CircleHelp, Eye } from 'lucide-react'

import { feedbackConfig } from '@/config/feedback'
import { cn } from '@/lib/utils'

import type { Media } from '../tool'
import { PostCard } from './post-card'
import { PreviewHeader } from './preview-header'
import { ScreenSizeProvider, useScreenSize } from './preview-size-context'

interface PreviewPanelProps {
    content: any
    media: Media | null
    onOpenFeedPreview?: () => void
    hasContent: boolean
}

const PreviewPanelContent: React.FC<PreviewPanelProps> = ({ content, media, onOpenFeedPreview, hasContent }) => {
    const { screenSize } = useScreenSize()

    const containerWidth = {
        mobile: 'w-[320px]',
        tablet: 'w-[480px]',
        desktop: 'w-[555px]',
    }

    return (
        <div className='flex h-full flex-col'>
            <PreviewHeader onOpenFeedPreview={onOpenFeedPreview} hasContent={hasContent} />
            <div className='flex flex-1 flex-col items-center gap-5 overflow-auto bg-neutral-50 py-5'>
                <div className={cn('mx-auto transition-all duration-300', containerWidth[screenSize])}>
                    <PostCard content={content} media={media} />
                </div>
                <div className='flex w-full gap-1.5 px-4 text-xs whitespace-nowrap text-neutral-400 sm:justify-center'>
                    <button
                        type='button'
                        onClick={() =>
                            window.Tally?.openPopup(feedbackConfig.formId, {
                                hiddenFields: { source: 'preview-panel', pageUrl: window.location.href },
                            })
                        }
                        className='flex items-center gap-1 transition-colors hover:text-neutral-600'>
                        <CircleHelp className='size-3.5' />
                        <span>Bug or feature request? Let us know</span>
                    </button>
                    {hasContent && onOpenFeedPreview && (
                        <>
                            <span aria-hidden='true'>·</span>
                            <button
                                type='button'
                                onClick={onOpenFeedPreview}
                                className='flex items-center gap-1 transition-colors hover:text-neutral-600'>
                                <Eye className='size-3.5' />
                                <span>See in a realistic LinkedIn feed</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ content, media, onOpenFeedPreview, hasContent }) => {
    return (
        <ScreenSizeProvider>
            <PreviewPanelContent
                content={content}
                media={media}
                onOpenFeedPreview={onOpenFeedPreview}
                hasContent={hasContent}
            />
        </ScreenSizeProvider>
    )
}
