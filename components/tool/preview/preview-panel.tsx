import type React from 'react'
import { ExternalLinkIcon, MonitorIcon, SmartphoneIcon, TabletIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
            {/* Compact controls bar */}
            <div className='flex shrink-0 items-center justify-between px-4 py-2'>
                <div className='flex items-center gap-1'>
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
                {hasContent && onOpenFeedPreview && (
                    <Button variant='outline' size='sm' className='h-7 text-xs' onClick={onOpenFeedPreview}>
                        <ExternalLinkIcon className='size-3' />
                        Open in feed
                    </Button>
                )}
            </div>

            {/* Preview area */}
            <div className='bg-muted/30 flex flex-1 flex-col items-center overflow-auto py-5 dark:bg-neutral-900/30'>
                <div className={cn('mx-auto transition-all duration-300', containerWidth[screenSize])}>
                    <PostCard content={content} media={media} />
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
