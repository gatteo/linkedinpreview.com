import type React from 'react'
import { CircleHelp } from 'lucide-react'

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
}

const PreviewPanelContent: React.FC<PreviewPanelProps> = ({ content, media, onOpenFeedPreview }) => {
    const { screenSize } = useScreenSize()

    const containerWidth = {
        mobile: 'w-[320px]',
        tablet: 'w-[480px]',
        desktop: 'w-[555px]',
    }

    return (
        <div className='flex h-full flex-col'>
            <PreviewHeader onOpenFeedPreview={onOpenFeedPreview} />
            <div className='flex flex-1 flex-col items-center gap-5 overflow-y-auto bg-neutral-50 py-5'>
                <div className={cn('mx-auto transition-all duration-300', containerWidth[screenSize])}>
                    <PostCard content={content} media={media} />
                </div>
                <div className='flex items-center gap-1.5 text-xs text-neutral-400'>
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
                    <span aria-hidden='true'>·</span>
                    <button
                        type='button'
                        onClick={onOpenFeedPreview}
                        className='transition-colors hover:text-neutral-600'>
                        See in real preview
                    </button>
                </div>
            </div>
        </div>
    )
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ content, media, onOpenFeedPreview }) => {
    return (
        <ScreenSizeProvider>
            <PreviewPanelContent content={content} media={media} onOpenFeedPreview={onOpenFeedPreview} />
        </ScreenSizeProvider>
    )
}
