'use client'

import type { LucideIcon } from 'lucide-react'

type SectionHeadingProps = {
    icon: LucideIcon
    title: string
    subtitle?: string
    eyebrow?: string
    children?: React.ReactNode
}

export function SectionHeading({ icon: Icon, title, subtitle, eyebrow, children }: SectionHeadingProps) {
    return (
        <div className='flex items-end justify-between gap-3'>
            <div className='flex items-center gap-2.5'>
                <div className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg'>
                    <Icon className='size-4' />
                </div>
                <div>
                    {eyebrow && (
                        <p className='tracking-label font-mono text-xs font-medium text-[color:var(--orange-600)] uppercase'>
                            {eyebrow}
                        </p>
                    )}
                    <h2 className='font-heading text-base leading-tight font-semibold tracking-tight'>{title}</h2>
                    {subtitle && <p className='text-muted-foreground text-xs'>{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    )
}
