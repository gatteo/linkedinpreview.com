'use client'

import type React from 'react'
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

export const PreviewHeader: React.FC = () => {
    const { screenSize, setScreenSize } = useScreenSize()

    const handleSizeChange = (newSize: typeof screenSize) => {
        setScreenSize(newSize)

        posthog.capture('preview_size_changed', {
            preview_size: newSize,
        })
    }

    return (
        <div className='border-border flex h-14 border-b px-4 sm:px-6'>
            <div className='flex grow items-center justify-between'>
                <h2 className='text-base font-semibold'>Post Preview</h2>
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
    )
}
