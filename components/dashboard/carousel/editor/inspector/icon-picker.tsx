'use client'

import * as React from 'react'

import { CAROUSEL_ICON_NAMES, CAROUSEL_ICONS } from '@/lib/carousel/icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function IconPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
    const [open, setOpen] = React.useState(false)
    const Current = CAROUSEL_ICONS[value] ?? CAROUSEL_ICONS.sparkles
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant='outline' size='sm' className='h-8 gap-2'>
                    <Current className='size-4' />
                    Change
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-64 p-2'>
                <div className='grid max-h-64 grid-cols-6 gap-1 overflow-y-auto'>
                    {CAROUSEL_ICON_NAMES.map((name) => {
                        const Icon = CAROUSEL_ICONS[name] ?? CAROUSEL_ICONS.sparkles
                        return (
                            <button
                                key={name}
                                type='button'
                                title={name}
                                onClick={() => {
                                    onChange(name)
                                    setOpen(false)
                                }}
                                className={cn(
                                    'flex aspect-square items-center justify-center rounded-md transition-colors',
                                    value === name ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                                )}>
                                <Icon className='size-4' />
                            </button>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}
