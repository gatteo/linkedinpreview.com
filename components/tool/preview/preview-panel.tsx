import type React from 'react'
import { CircleHelp, ExternalLink, MonitorIcon, SmartphoneIcon, TabletIcon } from 'lucide-react'

import { feedbackConfig } from '@/config/feedback'
import { cn } from '@/lib/utils'

import type { Media } from '../tool'
import { PostCard } from './post-card'
import { ScreenSizeProvider, useScreenSize } from './preview-size-context'
import type { PreviewAuthor } from './user-info'

interface PreviewPanelProps {
    content: any
    media: Media | null
    author?: PreviewAuthor
    promptBranding?: boolean
    onOpenFeedPreview?: () => void
    hasContent: boolean
}

function PreviewPanelContent({
    content,
    media,
    author,
    promptBranding,
    onOpenFeedPreview,
    hasContent,
}: PreviewPanelProps) {
    const { screenSize, setScreenSize } = useScreenSize()
    const containerWidth: Record<string, string> = {
        mobile: 'max-w-[320px]',
        tablet: 'max-w-[480px]',
        desktop: 'max-w-[555px]',
    }

    const sizes = ['mobile', 'tablet', 'desktop'] as const
    const sizeIcons: Record<string, any> = {
        mobile: SmartphoneIcon,
        tablet: TabletIcon,
        desktop: MonitorIcon,
    }

    return (
        <div className='flex h-full flex-col'>
            {/* Nav header (white): realistic-feed entry (left) + size switcher (right) */}
            <div className='bg-card border-border flex h-14 shrink-0 items-center gap-2 border-b px-3'>
                {hasContent && onOpenFeedPreview && (
                    <button
                        type='button'
                        onClick={onOpenFeedPreview}
                        className='bg-info/10 text-info hover:bg-info/20 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors'>
                        <ExternalLink className='size-3' />
                        Open realistic feed preview
                    </button>
                )}
                <div className='bg-muted ml-auto inline-flex items-center rounded-lg p-1'>
                    {sizes.map((size) => {
                        const Icon = sizeIcons[size]
                        return (
                            <button
                                key={size}
                                onClick={() => setScreenSize(size)}
                                className={cn(
                                    'rounded-md p-1.5 transition-colors',
                                    screenSize === size
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}>
                                <Icon className='size-4' />
                            </button>
                        )
                    })}
                </div>
            </div>
            {/* Preview area */}
            <div className='bg-muted/30 flex flex-1 flex-col items-center overflow-auto px-3 dark:bg-neutral-900/30'>
                <div className={cn('flex w-full flex-col transition-all duration-300', containerWidth[screenSize])}>
                    {/* Card */}
                    <div className='pt-4 pb-5'>
                        <PostCard content={content} media={media} author={author} promptBranding={promptBranding} />
                    </div>
                </div>
                {/* Inline links below card */}
                <div className='text-muted-foreground flex w-full gap-1.5 pb-4 text-xs whitespace-nowrap sm:justify-center'>
                    <button
                        type='button'
                        onClick={() =>
                            window.Tally?.openPopup(feedbackConfig.formId, {
                                hiddenFields: { source: 'preview-panel', pageUrl: window.location.href },
                            })
                        }
                        className='hover:text-foreground flex items-center gap-1 transition-colors'>
                        <CircleHelp className='size-3.5' />
                        <span>Bug or feature request? Let us know</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
    content,
    media,
    author,
    promptBranding,
    onOpenFeedPreview,
    hasContent,
}) => {
    return (
        <ScreenSizeProvider>
            <PreviewPanelContent
                content={content}
                media={media}
                author={author}
                promptBranding={promptBranding}
                onOpenFeedPreview={onOpenFeedPreview}
                hasContent={hasContent}
            />
        </ScreenSizeProvider>
    )
}
