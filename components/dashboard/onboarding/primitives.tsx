'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { AwardIcon, CheckIcon, GlobeIcon, LinkedinIcon, Loader2Icon, StarIcon, type LucideIcon } from 'lucide-react'

import type { FastIdentity } from '@/types/onboarding'
import type { ObReaction, ObTestimonial } from '@/config/onboarding-flow'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Onboarding shared primitives (design import: onboarding/flow/ui.jsx)
//
// The audit funnel reuses a small kit across all 17 steps: editorial type, a
// full-width vermilion CTA, big tappable choice cards, selectable chips, the
// assistant reaction bubble, checklist loaders, the LinkedIn-style profile
// card, and the social-proof review card. Centralizing them keeps each step
// lean and the look consistent.
// ---------------------------------------------------------------------------

export function Spinner({ className }: { className?: string }) {
    return <Loader2Icon className={cn('text-primary size-4 animate-spin', className)} />
}

/** The large ring spinner heading every loader screen. */
export function RingSpinner({ className }: { className?: string }) {
    return (
        <span
            className={cn('block size-[52px] animate-spin rounded-full border-[3px]', className)}
            style={{
                borderColor: 'color-mix(in oklch, var(--primary) 18%, transparent)',
                borderTopColor: 'var(--primary)',
            }}
        />
    )
}

// ── Text primitives ─────────────────────────────────────────────────────────

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'text-primary mb-3 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase',
                className,
            )}>
            {children}
        </div>
    )
}

export function H1({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <h1
            className={cn(
                'font-heading text-foreground mb-2.5 text-[26px] leading-[1.13] font-semibold tracking-[-0.02em] text-balance',
                className,
            )}>
            {children}
        </h1>
    )
}

export function Sub({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <p
            className={cn(
                'text-muted-foreground mb-[22px] max-w-[46ch] text-[15px] leading-[1.55] text-pretty [&_b]:font-semibold [&_b]:text-[var(--foreground)] [&_strong]:font-semibold [&_strong]:text-[var(--foreground)]',
                className,
            )}>
            {children}
        </p>
    )
}

export function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={cn('text-foreground mt-1 mb-[9px] text-[13px] font-semibold', className)}>{children}</p>
}

// ── CTA + ghost link ────────────────────────────────────────────────────────

export function CTA({
    children,
    onClick,
    disabled,
    variant = 'default',
    className,
}: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    variant?: 'default' | 'outline'
    className?: string
}) {
    return (
        <Button
            variant={variant}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'font-heading h-auto w-full gap-2 rounded-xl px-[18px] py-3.5 text-[15px] font-semibold tracking-[-0.01em]',
                className,
            )}>
            {children}
        </Button>
    )
}

export function GhostLink({
    children,
    onClick,
    className,
}: {
    children: React.ReactNode
    onClick?: () => void
    className?: string
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            className={cn(
                'text-muted-foreground hover:text-foreground cursor-pointer p-1 text-[13px] hover:underline hover:underline-offset-[3px]',
                className,
            )}>
            {children}
        </button>
    )
}

// ── Choice card (big tappable option row) ───────────────────────────────────

export function ChoiceCard({
    icon: Icon,
    title,
    desc,
    selected,
    onClick,
}: {
    icon: LucideIcon
    title: string
    desc: string
    selected?: boolean
    onClick: () => void
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            aria-pressed={!!selected}
            className={cn(
                'flex w-full cursor-pointer items-center gap-[13px] rounded-[13px] border px-[15px] py-[13px] text-left shadow-[var(--shadow-subtle)] transition-all',
                'hover:border-primary/60 hover:-translate-y-px hover:shadow-[var(--shadow-elevated)] active:translate-y-0 active:scale-[0.995]',
                selected
                    ? 'border-primary bg-[color-mix(in_oklch,var(--primary)_7%,var(--card))] shadow-[0_0_0_1px_var(--primary),var(--shadow-subtle)]'
                    : 'border-border bg-card',
            )}>
            <span
                className={cn(
                    'flex size-[38px] shrink-0 items-center justify-center rounded-[10px] border transition-colors',
                    selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-petrol-500 bg-[color-mix(in_oklch,var(--muted)_55%,transparent)]',
                )}>
                <Icon className='size-5' />
            </span>
            <span className='flex min-w-0 flex-col gap-0.5'>
                <b className='text-[14.5px] font-semibold'>{title}</b>
                <span className='text-muted-foreground text-[12.5px] leading-[1.4]'>{desc}</span>
            </span>
            <span className='text-primary ml-auto flex shrink-0'>
                {selected && <CheckIcon className='size-4' strokeWidth={2.5} />}
            </span>
        </button>
    )
}

// ── Chip (selectable / dashed-add) ──────────────────────────────────────────

export function Chip({
    children,
    selected,
    add,
    icon: Icon,
    onClick,
    disabled,
}: {
    children: React.ReactNode
    selected?: boolean
    add?: boolean
    icon?: LucideIcon
    onClick?: () => void
    disabled?: boolean
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            disabled={disabled || !onClick}
            aria-pressed={!!selected}
            className={cn(
                'inline-flex items-center gap-1 rounded-full border px-[13px] py-2 text-[13px] font-medium transition-colors',
                onClick && 'hover:border-primary/50 cursor-pointer',
                'disabled:pointer-events-none disabled:opacity-40',
                selected
                    ? 'bg-accent border-primary text-accent-foreground'
                    : add
                      ? 'text-muted-foreground border-dashed bg-transparent'
                      : 'bg-secondary border-border text-secondary-foreground',
            )}>
            {add && <span className='text-primary font-bold'>+</span>}
            {Icon && <Icon className='size-3.5' />}
            {children}
        </button>
    )
}

// ── Assistant reaction bubble ───────────────────────────────────────────────

export function Reaction({ reaction, className }: { reaction: ObReaction; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                'bg-accent border-primary/30 mb-[18px] flex items-start gap-[11px] rounded-[13px] border px-3.5 py-3',
                className,
            )}>
            <span className='bg-primary text-primary-foreground grid size-[26px] shrink-0 place-items-center rounded-full'>
                <StarIcon className='size-[13px] fill-current' strokeWidth={0} />
            </span>
            <p className='text-accent-foreground m-0 text-[13.5px] leading-[1.55]'>
                <b className='font-semibold text-[var(--orange-700)]'>{reaction.lead}</b> {reaction.body}
            </p>
        </motion.div>
    )
}

// ── Loader (ring spinner + rotating checklist) ──────────────────────────────

export function LoaderBlock({
    title,
    status,
    steps,
    doneCount,
}: {
    title: string
    status: string
    steps: string[]
    doneCount: number
}) {
    return (
        <div className='pt-1.5 pb-0.5 text-center'>
            <RingSpinner className='mx-auto mt-2 mb-5' />
            <H1 className='mb-2 text-center'>{title}</H1>
            <div className='text-muted-foreground mb-5 h-5 text-[13.5px]'>{status}</div>
            <div className='bg-secondary border-border rounded-[13px] border p-1.5 text-left'>
                {steps.map((step, i) => (
                    <div
                        key={step}
                        className={cn(
                            'text-muted-foreground flex items-center gap-2.5 px-3 py-2 text-[13px] transition-opacity',
                            i < doneCount ? 'opacity-100' : 'opacity-50',
                        )}>
                        <span className='text-success flex w-4 shrink-0'>
                            {i < doneCount ? (
                                <CheckIcon className='size-3.5' strokeWidth={2.5} />
                            ) : i === doneCount ? (
                                <Loader2Icon className='text-primary size-3.5 animate-spin' />
                            ) : (
                                <span className='border-border-strong block size-3 rounded-full border-[1.5px]' />
                            )}
                        </span>
                        <span>{step}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Live "analyzing" chip (pulsing dot) ─────────────────────────────────────

export function LiveChip({ children }: { children: React.ReactNode }) {
    return (
        <span
            className='inline-flex items-center gap-[9px] rounded-full border px-[15px] py-[7px] text-[12.5px] font-medium'
            style={{
                background: 'color-mix(in oklch, var(--info-soft) 55%, transparent)',
                borderColor: 'color-mix(in oklch, var(--info) 22%, transparent)',
                color: 'var(--info)',
            }}>
            <span className='bg-info animate-ob-pulse size-[7px] shrink-0 rounded-full' />
            {children}
        </span>
    )
}

// ── Avatar (real photo when available, on-brand initials otherwise) ─────────

export function PersonAvatar({
    name,
    src,
    size = 40,
    ring,
    className,
}: {
    name?: string
    src?: string
    size?: number
    ring?: boolean
    className?: string
}) {
    const [failed, setFailed] = React.useState(false)
    const ringShadow = ring ? '0 0 0 2px var(--primary), 0 0 0 4px var(--card)' : 'inset 0 0 0 1px oklch(1 0 0 / 0.12)'
    if (src && !failed) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={src}
                alt={name ?? ''}
                onError={() => setFailed(true)}
                className={cn('shrink-0 rounded-full object-cover', className)}
                style={{
                    width: size,
                    height: size,
                    background: 'linear-gradient(135deg, var(--petrol-700), var(--petrol-500))',
                    boxShadow: ringShadow,
                }}
            />
        )
    }
    return (
        <span
            className={cn(
                'font-heading grid shrink-0 place-items-center rounded-full font-semibold tracking-[-0.01em]',
                className,
            )}
            style={{
                width: size,
                height: size,
                fontSize: Math.round(size * 0.36),
                background: 'linear-gradient(135deg, var(--petrol-700), var(--petrol-500))',
                color: 'oklch(0.97 0.01 90)',
                boxShadow: ringShadow,
            }}>
            {initials(name) || '?'}
        </span>
    )
}

// ── Stars ───────────────────────────────────────────────────────────────────

export function Stars({ size = 15, className }: { size?: number; className?: string }) {
    return (
        <span className={cn('inline-flex gap-0.5 text-[var(--orange-500)]', className)}>
            {[0, 1, 2, 3, 4].map((i) => (
                <StarIcon key={i} style={{ width: size, height: size }} className='fill-current' strokeWidth={0} />
            ))}
        </span>
    )
}

// ── LinkedIn-style profile card (Reassure) ──────────────────────────────────

export function LinkedInCard({
    profile,
    identity,
}: {
    profile: { name: string; headline: string; avatarUrl: string }
    identity?: FastIdentity
}) {
    const languages = (identity?.languages ?? []).map((l) => l.name).slice(0, 2)
    return (
        <div className='border-border bg-card overflow-hidden rounded-[14px] border shadow-[0_1px_2px_oklch(0_0_0/0.05)]'>
            <div
                className='h-[68px] bg-cover bg-center'
                style={{
                    backgroundImage: identity?.coverUrl
                        ? `url(${identity.coverUrl})`
                        : 'linear-gradient(120deg, var(--petrol-700), var(--petrol-500))',
                }}
            />
            <div className='px-[18px] pb-4'>
                <div className='-mt-8 mb-2.5 w-max rounded-full shadow-[0_0_0_3px_var(--card)]'>
                    <PersonAvatar name={profile.name} src={profile.avatarUrl} size={64} />
                </div>
                <div className='flex flex-wrap items-center gap-2.5'>
                    <div className='text-[17px] font-bold tracking-[-0.01em]'>{profile.name}</div>
                    {identity?.awards?.[0] && (
                        <span
                            className='inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[11px] font-semibold'
                            style={{
                                background: 'color-mix(in oklch, var(--orange-500) 14%, transparent)',
                                color: 'var(--orange-600)',
                            }}>
                            <AwardIcon className='size-3 text-[var(--orange-500)]' />
                            {identity.awards[0]}
                        </span>
                    )}
                </div>
                {profile.headline && <div className='text-foreground mt-[3px] text-[13px]'>{profile.headline}</div>}
                {(identity?.location || languages.length > 0) && (
                    <div className='text-muted-foreground mt-[5px] flex items-center gap-1.5 text-[12.5px]'>
                        <GlobeIcon className='size-[13px]' />
                        {[identity?.location, languages.length ? `Speaks ${languages.join(' & ')}` : '']
                            .filter(Boolean)
                            .join(' · ')}
                    </div>
                )}
                {!!identity?.experience?.length && (
                    <div className='mt-[11px] flex flex-wrap gap-[7px]'>
                        {identity.experience.map((e) => (
                            <span
                                key={e.name}
                                className='border-border bg-secondary text-foreground inline-flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-[5px] text-xs font-medium'>
                                {e.logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={e.logoUrl}
                                        alt=''
                                        className='bg-card size-[18px] rounded object-cover'
                                        onError={(ev) => {
                                            ;(ev.target as HTMLImageElement).style.display = 'none'
                                        }}
                                    />
                                ) : null}
                                {e.name}
                            </span>
                        ))}
                    </div>
                )}
                {(identity?.followersLabel || identity?.connectionsLabel) && (
                    <div className='border-border text-muted-foreground mt-[13px] flex gap-[18px] border-t pt-3 text-[13px]'>
                        {identity.followersLabel && (
                            <span>
                                <b className='text-foreground font-bold'>{identity.followersLabel}</b> followers
                            </span>
                        )}
                        {identity.connectionsLabel && (
                            <span>
                                <b className='text-foreground font-bold'>{identity.connectionsLabel}</b> connections
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Review card (social proof wall) ─────────────────────────────────────────

export function ReviewCard({
    t,
    followersOnly,
    compact,
}: {
    t: ObTestimonial
    followersOnly?: boolean
    compact?: boolean
}) {
    const meta = followersOnly
        ? t.followers
            ? `${t.followers} followers`
            : t.role
        : `${t.role}${t.followers ? ` · ${t.followers} followers` : ''}`
    return (
        <div
            className={cn(
                'bg-secondary border-border mb-2 break-inside-avoid rounded-xl border',
                compact ? 'rounded-[10px] p-[10px_11px]' : 'p-3',
            )}>
            <div className={cn('flex items-center gap-2', compact ? 'mb-1.5' : 'mb-2')}>
                <PersonAvatar name={t.name} src={t.avatar ? `/images/reviews/${t.avatar}` : undefined} size={30} />
                <div className='min-w-0'>
                    <b className={cn('block leading-[1.2] font-semibold', compact ? 'text-[11.5px]' : 'text-[12.5px]')}>
                        {t.name}
                    </b>
                    <span className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-[10.5px]')}>
                        {meta}
                    </span>
                </div>
                <span className='ml-auto grid size-5 shrink-0 place-items-center rounded-[5px] bg-[var(--linkedin)] text-white'>
                    <LinkedinIcon className='size-3 fill-current' strokeWidth={0} />
                </span>
            </div>
            {t.result ? (
                <div className='grid gap-[5px]'>
                    {t.result.map((r, i) => (
                        <div
                            key={i}
                            className={cn(
                                'text-muted-foreground flex items-baseline justify-between',
                                compact ? 'text-[11px]' : 'text-xs',
                            )}>
                            <span>{r[0]}</span>
                            <b className={cn('font-heading text-success', compact ? 'text-[13px]' : 'text-[15px]')}>
                                {r[1]}
                            </b>
                        </div>
                    ))}
                </div>
            ) : (
                <p
                    className={cn(
                        'text-card-foreground m-0',
                        compact ? 'text-[11.5px] leading-[1.42]' : 'text-[12.5px] leading-normal',
                    )}>
                    &ldquo;{t.quote}&rdquo;
                </p>
            )}
            {t.shot && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={`/images/reviews/${t.shot}`}
                    alt='LinkedIn analytics screenshot'
                    loading='lazy'
                    className={cn(
                        'border-border mt-2 block w-full rounded-md border bg-white',
                        compact && 'max-h-[116px] rounded-md object-cover object-top',
                    )}
                />
            )}
        </div>
    )
}

// ── Stagger wrapper ─────────────────────────────────────────────────────────

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

// ── helpers ─────────────────────────────────────────────────────────────────

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

/** Coarse "N weeks/months ago" for post-recency lines. */
export function timeAgoLabel(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
    if (days < 60) {
        const weeks = Math.max(1, Math.round(days / 7))
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
    }
    return `${Math.round(days / 30)} months ago`
}
