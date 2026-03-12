import type React from 'react'
import { CircleHelp, Eye, MonitorIcon, SmartphoneIcon, TabletIcon } from 'lucide-react'

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
                {/* Size switcher - right aligned, tabs style */}
                <div className='flex w-full justify-end px-3 pt-3 pb-1'>
                    <div className='bg-muted inline-flex items-center rounded-lg p-1'>
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
                {/* Card */}
                <div className={cn('mx-auto pb-5 transition-all duration-300', containerWidth[screenSize])}>
                    <PostCard content={content} media={media} />
                </div>
                {/* Inline links below card */}
                <div className='text-muted-foreground flex w-full gap-1.5 px-4 pb-4 text-xs whitespace-nowrap sm:justify-center'>
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
                    {hasContent && onOpenFeedPreview && (
                        <>
                            <span aria-hidden='true'>·</span>
                            <button
                                type='button'
                                onClick={onOpenFeedPreview}
                                className='hover:text-foreground flex items-center gap-1 transition-colors'>
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
