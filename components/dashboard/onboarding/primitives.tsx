'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Loader2Icon, type LucideIcon } from 'lucide-react'

import { staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Onboarding shared primitives
//
// The split-screen onboarding (design import: onboarding/index.html) reuses a
// small kit across all 13 steps: editorial type, round selectable pills, large
// "clicky" selector cards, a gradient initials avatar, and a stagger wrapper.
// Centralizing them keeps each step lean and the look consistent.
// ---------------------------------------------------------------------------

export function Spinner({ className }: { className?: string }) {
    return <Loader2Icon className={cn('text-primary size-4 animate-spin', className)} />
}

export function H2({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <h2
            className={cn(
                'font-heading text-foreground text-2xl leading-tight font-semibold tracking-tight text-balance',
                className,
            )}>
            {children}
        </h2>
    )
}

export function Sub({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={cn('text-muted-foreground text-sm leading-relaxed text-pretty', className)}>{children}</p>
}

export function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={cn('text-foreground text-sm font-medium', className)}>{children}</p>
}

// Round selectable chip (goals / audience / tone / role).
export function Pill({
    selected,
    onClick,
    children,
    icon: Icon,
    disabled,
}: {
    selected?: boolean
    onClick: () => void
    children: React.ReactNode
    icon?: LucideIcon
    disabled?: boolean
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            disabled={disabled}
            aria-pressed={!!selected}
            className={cn(
                'inline-flex items-center gap-[7px] rounded-full border px-3.5 text-[13.5px] font-medium transition-all',
                'disabled:pointer-events-none disabled:opacity-40',
                Icon ? 'py-2' : 'py-[7px]',
                selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted/45 text-foreground hover:border-primary/40',
            )}>
            {Icon && <Icon className='size-[15px]' />}
            {children}
        </button>
    )
}

// Large tappable option row - the themed "clicky" selector card (welcome / cadence).
export function OptionRow({
    icon: Icon,
    onClick,
    selected,
    children,
    right,
}: {
    icon?: LucideIcon
    onClick: () => void
    selected?: boolean
    children: React.ReactNode
    right?: React.ReactNode
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            aria-pressed={!!selected}
            data-selected={selected ? 'true' : 'false'}
            className={cn(
                'group border-border bg-card flex w-full items-center gap-3 rounded-xl border px-[15px] py-3 text-left shadow-[var(--shadow-subtle)] transition-all',
                'hover:border-primary/60 hover:bg-primary/5 hover:-translate-y-px hover:shadow-[var(--shadow-elevated)]',
                'active:translate-y-0 active:scale-[0.995]',
                'data-[selected=true]:border-primary data-[selected=true]:bg-primary/[0.08] data-[selected=true]:shadow-[0_0_0_1px_var(--primary),var(--shadow-subtle)]',
            )}>
            {Icon && (
                <span
                    className={cn(
                        'border-border bg-muted/50 text-muted-foreground flex size-9.5 shrink-0 items-center justify-center rounded-[10px] border transition-all',
                        'group-hover:border-primary/45 group-hover:bg-primary/15 group-hover:text-primary',
                        'group-data-[selected=true]:border-primary group-data-[selected=true]:bg-primary group-data-[selected=true]:text-primary-foreground',
                    )}>
                    <Icon className='size-[18px]' />
                </span>
            )}
            <span className='text-foreground min-w-0 flex-1 text-sm font-medium'>{children}</span>
            {right}
        </button>
    )
}

// Avatar with initials fallback - petrol gradient, optional primary ring.
export function InitialAvatar({ name, size = 80, ring }: { name?: string; size?: number; ring?: boolean }) {
    return (
        <span
            style={{
                width: size,
                height: size,
                fontSize: Math.round(size * 0.36),
                background: 'linear-gradient(150deg, var(--petrol-400), var(--petrol-700))',
                color: 'oklch(0.98 0.01 90)',
            }}
            className={cn(
                'inline-flex items-center justify-center rounded-full font-semibold tracking-tight',
                ring && 'ring-primary/30 ring-[3px]',
            )}>
            {initials(name) || '?'}
        </span>
    )
}

// Children that animate in with a staggered rise.
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            variants={staggerContainer}
            initial='hidden'
            animate='visible'
            className={cn('flex flex-col', className)}>
            {React.Children.toArray(children).map((child, i) => (
                <motion.div key={i} variants={staggerItem}>
                    {child}
                </motion.div>
            ))}
        </motion.div>
    )
}

// ── helpers ──────────────────────────────────────────────────────────────
export function initials(name?: string): string {
    return (name ?? '')
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

export function firstName(name?: string): string {
    return (name ?? '').trim().split(' ')[0] ?? ''
}
