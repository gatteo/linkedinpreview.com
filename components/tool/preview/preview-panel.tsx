import type React from 'react'
import { MonitorIcon, SmartphoneIcon, TabletIcon } from 'lucide-react'

import { feedbackConfig } from '@/config/feedback'
import { cn } from '@/lib/utils'

import type { Media } from '../tool'
import { PostCard } from './post-card'
import { ScreenSizeProvider, useScreenSize } from './preview-size-context'

interface PreviewPanelProps {
    content: any
    media: Media | null
    onOpenFeedPreview?: () => void
    hasContent: boolean
}

function PreviewPanelContent({ content, media, onOpenFeedPreview, hasContent }: PreviewPanelProps) {
    const { screenSize, setScreenSize } = useScreenSize()
    const containerWidth: Record<string, string> = {
        mobile: 'w-[320px]',
        tablet: 'w-[480px]',
        desktop: 'w-[555px]',
    }

    const sizes = ['mobile', 'tablet', 'desktop'] as const
    const sizeIcons: Record<string, any> = {
        mobile: SmartphoneIcon,
        tablet: TabletIcon,
        desktop: MonitorIcon,
    }

    return (
        <div className='flex h-full flex-col'>
            {/* Preview area */}
            <div className='bg-muted/30 flex flex-1 flex-col items-center overflow-auto dark:bg-neutral-900/30'>
                {/* Size switcher */}
                <div className='flex shrink-0 items-center gap-1 pt-3 pb-1'>
                    {sizes.map((size) => {
                        const Icon = sizeIcons[size]
                        return (
                            <button
                                key={size}
                                onClick={() => setScreenSize(size)}
                                className={cn(
                                    'rounded-md p-1.5 transition-colors',
                                    screenSize === size
                                        ? 'bg-accent text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}>
                                <Icon className='size-4' />
                            </button>
                        )
                    })}
                </div>
                {/* Card */}
                <div className={cn('mx-auto pb-5 transition-all duration-300', containerWidth[screenSize])}>
                    <PostCard content={content} media={media} />
                </div>
            </div>

            {/* Bottom bar */}
            {hasContent && (
                <div className='border-border flex shrink-0 items-center justify-between border-t px-4 py-2'>
                    <button
                        type='button'
                        data-tally-open={feedbackConfig.formId}
                        data-tally-emoji-text='👋'
                        data-tally-emoji-animation='wave'
                        className='text-muted-foreground hover:text-foreground text-xs transition-colors'>
                        Share feedback
                    </button>
                    {onOpenFeedPreview && (
                        <button
                            type='button'
                            onClick={onOpenFeedPreview}
                            className='text-muted-foreground hover:text-foreground text-xs transition-colors'>
                            See in a realistic LinkedIn feed
                        </button>
                    )}
                </div>
            )}
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
