'use client'

import { Separator } from 'react-resizable-panels'

import { cn } from '@/lib/utils'

export function ResizeHandle({ className }: { className?: string }) {
    return (
        <Separator
            className={cn(
                'bg-border group hover:bg-muted-foreground/30 data-[separator=active]:bg-primary relative flex w-px items-center justify-center transition-colors',
                className,
            )}>
            <div className='bg-muted-foreground/40 group-hover:bg-muted-foreground/60 group-data-[separator=active]:bg-primary absolute z-10 h-8 w-1 rounded-full transition-colors' />
        </Separator>
    )
}
