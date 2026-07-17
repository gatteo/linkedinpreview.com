'use client'

// ---------------------------------------------------------------------------
// Small inspector control primitives shared by the element/slide/deck editors.
// Range fields support gesture coalescing (begin/endBatch) so a slider drag is
// a single undo step.
// ---------------------------------------------------------------------------
import * as React from 'react'

import { type ResolvedTheme } from '@/lib/carousel/theme'
import { type ColorToken } from '@/lib/carousel/types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className='flex items-center justify-between gap-3 py-1'>
            <span className='text-muted-foreground shrink-0 text-xs'>{label}</span>
            <div className='flex min-w-0 flex-1 justify-end'>{children}</div>
        </label>
    )
}

export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <div className='border-border/60 space-y-1 border-b px-4 py-3 last:border-b-0'>
            {title ? <p className='text-foreground mb-1.5 text-xs font-semibold'>{title}</p> : null}
            {children}
        </div>
    )
}

export function NumberField({
    value,
    onChange,
    min,
    max,
    step = 1,
    suffix,
}: {
    value: number
    onChange: (v: number) => void
    min?: number
    max?: number
    step?: number
    suffix?: string
}) {
    return (
        <div className='relative w-24'>
            <Input
                type='number'
                value={Math.round(value)}
                min={min}
                max={max}
                step={step}
                onChange={(e) => {
                    const n = Number(e.target.value)
                    if (!Number.isNaN(n))
                        onChange(
                            max != null || min != null ? Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n)) : n,
                        )
                }}
                className='h-8 pr-7 text-sm'
            />
            {suffix ? (
                <span className='text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs'>
                    {suffix}
                </span>
            ) : null}
        </div>
    )
}

export function RangeField({
    value,
    onChange,
    min = 0,
    max = 1,
    step = 0.01,
    onCommitStart,
    onCommitEnd,
}: {
    value: number
    onChange: (v: number) => void
    min?: number
    max?: number
    step?: number
    onCommitStart?: () => void
    onCommitEnd?: () => void
}) {
    return (
        <input
            type='range'
            value={value}
            min={min}
            max={max}
            step={step}
            onPointerDown={onCommitStart}
            onPointerUp={onCommitEnd}
            onChange={(e) => onChange(Number(e.target.value))}
            className='accent-primary h-1.5 w-32 cursor-pointer'
        />
    )
}

export function Segmented<T extends string>({
    value,
    options,
    onChange,
}: {
    value: T
    options: { value: T; label: React.ReactNode; title?: string }[]
    onChange: (v: T) => void
}) {
    return (
        <div className='bg-muted inline-flex rounded-md p-0.5'>
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type='button'
                    title={opt.title}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        'flex h-7 min-w-7 items-center justify-center rounded px-2 text-xs font-medium transition-colors',
                        value === opt.value
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                    )}>
                    {opt.label}
                </button>
            ))}
        </div>
    )
}

const TOKEN_SWATCHES: ColorToken[] = ['text', 'accent', 'accentText', 'muted', 'surface', 'bg']

export function ColorField({
    theme,
    token,
    color,
    onChange,
}: {
    theme: ResolvedTheme
    token?: ColorToken
    color?: string
    onChange: (next: { colorToken?: ColorToken; color?: string }) => void
}) {
    return (
        <div className='flex flex-wrap items-center justify-end gap-1.5'>
            {TOKEN_SWATCHES.map((t) => (
                <button
                    key={t}
                    type='button'
                    title={t}
                    onClick={() => onChange({ colorToken: t, color: undefined })}
                    className={cn(
                        'size-6 rounded-full border transition-transform hover:scale-110',
                        !color && token === t ? 'ring-primary ring-2 ring-offset-1' : 'border-border',
                    )}
                    style={{ background: theme.colors[t] }}
                />
            ))}
            <label
                className={cn(
                    'relative size-6 overflow-hidden rounded-full border',
                    color ? 'ring-primary ring-2 ring-offset-1' : 'border-border',
                )}
                title='Custom color'
                style={{ background: color ?? 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}>
                <input
                    type='color'
                    value={color ?? '#000000'}
                    onChange={(e) => onChange({ color: e.target.value, colorToken: token })}
                    className='absolute inset-0 cursor-pointer opacity-0'
                />
            </label>
        </div>
    )
}
