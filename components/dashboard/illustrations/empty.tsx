// ---------------------------------------------------------------------------
// Empty-state illustrations — static, clean line-art. Two-color: `currentColor`
// for line work (set via a text-* class by the caller) + `--primary` accent.
// Reused by <EmptyState> across posts / drafts / calendar / strategy.
// ---------------------------------------------------------------------------

import { cn } from '@/lib/utils'

type IllustrationProps = {
    className?: string
}

/** A stylized post card with a soft dashed outline. */
export function EmptyPosts({ className }: IllustrationProps) {
    return (
        <svg viewBox='0 0 160 130' fill='none' className={cn('text-muted-foreground/60', className)} aria-hidden='true'>
            <rect
                x='24'
                y='20'
                width='112'
                height='90'
                rx='12'
                stroke='currentColor'
                strokeWidth='2'
                strokeDasharray='6 7'
            />
            <circle cx='50' cy='46' r='10' className='fill-primary/10 stroke-primary' strokeWidth='2' />
            <rect x='68' y='40' width='44' height='6' rx='3' fill='currentColor' opacity='0.45' />
            <rect x='68' y='51' width='28' height='6' rx='3' fill='currentColor' opacity='0.3' />
            <rect x='40' y='74' width='80' height='6' rx='3' fill='currentColor' opacity='0.25' />
            <rect x='40' y='86' width='56' height='6' rx='3' fill='currentColor' opacity='0.2' />
            <circle cx='118' cy='100' r='12' className='fill-primary' />
            <path
                d='M118 95 v10 M113 100 h10'
                stroke='var(--primary-foreground)'
                strokeWidth='2'
                strokeLinecap='round'
            />
        </svg>
    )
}

/** Compact, sidebar-scale draft glyph. */
export function EmptyDrafts({ className }: IllustrationProps) {
    return (
        <svg viewBox='0 0 120 80' fill='none' className={cn('text-muted-foreground/60', className)} aria-hidden='true'>
            <rect
                x='30'
                y='14'
                width='60'
                height='52'
                rx='8'
                stroke='currentColor'
                strokeWidth='2'
                strokeDasharray='5 6'
            />
            <rect x='40' y='26' width='40' height='5' rx='2.5' fill='currentColor' opacity='0.35' />
            <rect x='40' y='37' width='30' height='5' rx='2.5' fill='currentColor' opacity='0.25' />
            <path
                d='M74 50 l14 -14 a3 3 0 0 1 4 4 l-14 14 l-6 2 z'
                className='fill-primary/15 stroke-primary'
                strokeWidth='2'
                strokeLinejoin='round'
            />
        </svg>
    )
}

/** Line-art calendar grid with one highlighted cell. */
export function EmptyCalendar({ className }: IllustrationProps) {
    return (
        <svg viewBox='0 0 160 130' fill='none' className={cn('text-muted-foreground/60', className)} aria-hidden='true'>
            <rect x='26' y='26' width='108' height='86' rx='10' stroke='currentColor' strokeWidth='2' />
            <path d='M26 50 h108' stroke='currentColor' strokeWidth='2' />
            <path d='M52 20 v14 M108 20 v14' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
            {[0, 1, 2].map((r) =>
                [0, 1, 2, 3].map((c) => (
                    <rect
                        key={`${r}-${c}`}
                        x={40 + c * 22}
                        y={62 + r * 16}
                        width='12'
                        height='9'
                        rx='2.5'
                        fill='currentColor'
                        opacity='0.18'
                    />
                )),
            )}
            <rect x={40 + 2 * 22} y={62 + 1 * 16} width='12' height='9' rx='2.5' className='fill-primary' />
        </svg>
    )
}

/** Concentric target / route motif for strategy. */
export function EmptyStrategy({ className }: IllustrationProps) {
    return (
        <svg viewBox='0 0 160 130' fill='none' className={cn('text-muted-foreground/60', className)} aria-hidden='true'>
            <circle cx='80' cy='65' r='44' stroke='currentColor' strokeWidth='2' opacity='0.4' />
            <circle cx='80' cy='65' r='28' stroke='currentColor' strokeWidth='2' opacity='0.6' />
            <circle cx='80' cy='65' r='12' className='fill-primary/15 stroke-primary' strokeWidth='2' />
            <circle cx='80' cy='65' r='4' className='fill-primary' />
            <path
                d='M80 65 L128 30'
                className='stroke-primary'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeDasharray='2 7'
            />
            <path
                d='M122 24 l10 2 l-2 10'
                className='stroke-primary'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                fill='none'
            />
        </svg>
    )
}
