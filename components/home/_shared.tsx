import { type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Rail-grid section frame. Every stacked section shares two continuous vertical
 * hairlines (border-x on the centered max-width container) while the section's
 * top divider bleeds full-width into the gutters - the Attio grid.
 */
export function Section({
    id,
    children,
    className,
    innerClassName,
    bleedTop = true,
}: {
    id?: string
    children: ReactNode
    className?: string
    innerClassName?: string
    bleedTop?: boolean
}) {
    return (
        <section id={id} className={cn(bleedTop && 'border-border border-t', className)}>
            <div className={cn('max-w-content border-border mx-auto border-x px-7', innerClassName)}>{children}</div>
        </section>
    )
}

/** Attio-style mono eyebrow: uppercase, wide tracking, vermilion. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <p
            className={cn(
                'tracking-label font-mono text-xs font-medium text-[color:var(--orange-600)] uppercase',
                className,
            )}>
            {children}
        </p>
    )
}

export function SectionHead({
    eyebrow,
    title,
    sub,
    action,
    className,
}: {
    eyebrow?: ReactNode
    title: ReactNode
    sub?: ReactNode
    action?: ReactNode
    className?: string
}) {
    return (
        <div className={cn('flex flex-wrap items-end justify-between gap-6', className)}>
            <div className='section-head-block max-w-[70%] max-md:max-w-full'>
                {eyebrow && <Eyebrow className='mb-3'>{eyebrow}</Eyebrow>}
                <h2 className='font-heading text-[clamp(30px,4vw,42px)] leading-[1.06] font-bold tracking-[-0.025em]'>
                    {title}
                </h2>
                {sub && <p className='text-muted-foreground mt-3.5 text-base leading-relaxed'>{sub}</p>}
            </div>
            {action}
        </div>
    )
}

/**
 * The canonical accent icon tile: vermilion-wash square with an inset hairline
 * ring. `md` (size-10 / 10px radius) for feature cards, `sm` (size-8.5 / 9px)
 * for dense rows. Single source of truth so every tile reads identically.
 */
export function IconTile({
    icon: Icon,
    size = 'md',
    className,
}: {
    icon: LucideIcon
    size?: 'md' | 'sm'
    className?: string
}) {
    return (
        <span
            className={cn(
                'bg-accent text-accent-foreground flex shrink-0 items-center justify-center shadow-[inset_0_0_0_1px_var(--orange-100)]',
                size === 'md' ? 'size-10 rounded-[10px]' : 'size-8.5 rounded-[9px]',
                className,
            )}>
            <Icon className={size === 'md' ? 'size-[19px]' : 'size-[17px]'} />
        </span>
    )
}

/** Horizontal feature row: accent tile + heading + body, shared across sections. */
export function FeatureItem({ icon, title, body }: { icon: LucideIcon; title: ReactNode; body: ReactNode }) {
    return (
        <div className='flex gap-4'>
            <IconTile icon={icon} />
            <div>
                <h3 className='font-heading mb-1 text-[16.5px] font-semibold tracking-[-0.01em]'>{title}</h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>{body}</p>
            </div>
        </div>
    )
}
