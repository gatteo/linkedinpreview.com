'use client'

import type React from 'react'
import { ExternalLink } from 'lucide-react'
import posthog from 'posthog-js'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Icon, type Icons } from '@/components/icon'

import { useScreenSize } from './preview-size-context'

const sizes = [
    { value: 'mobile', label: 'Mobile' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'desktop', label: 'Desktop' },
] as const

interface PreviewHeaderProps {
    onOpenFeedPreview?: () => void
    hasContent: boolean
}

export const PreviewHeader: React.FC<PreviewHeaderProps> = ({ onOpenFeedPreview, hasContent }) => {
    const { screenSize, setScreenSize } = useScreenSize()

    const handleSizeChange = (newSize: typeof screenSize) => {
        setScreenSize(newSize)

        posthog.capture('preview_size_changed', {
            preview_size: newSize,
        })
    }

    const handleOpenFeedPreview = () => {
        posthog.capture('feed_preview_opened')
        onOpenFeedPreview?.()
    }

    return (
        <div className='border-border flex h-14 border-b px-4 sm:px-6'>
            <div className='flex grow items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <h2 className='hidden text-base font-semibold sm:block'>Post Preview</h2>
                    {onOpenFeedPreview && hasContent && (
                        <button
                            type='button'
                            onClick={handleOpenFeedPreview}
                            className='flex items-center gap-1.5 rounded-full bg-[#0a66c2]/10 px-2.5 py-1 text-xs font-medium text-[#0a66c2] transition-colors hover:bg-[#0a66c2]/20'>
                            <ExternalLink className='size-3' />
                            Open realistic feed preview
                        </button>
                    )}
                </div>
                <div className='flex items-center gap-2'>
                    <div className='flex items-center gap-1'>
                        {sizes.map((size) => (
                            <Tooltip key={size.value}>
                                <TooltipTrigger asChild>
                                    <button
                                        type='button'
                                        onClick={() => handleSizeChange(size.value)}
                                        className={cn(
                                            'rounded-md p-1.5 transition-colors',
                                            screenSize === size.value
                                                ? 'bg-foreground text-background'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                                        )}>
                                        <Icon name={size.value as keyof typeof Icons} className='size-4' />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>{size.label}</TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
