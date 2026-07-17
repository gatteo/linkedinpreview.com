'use client'

// ---------------------------------------------------------------------------
// Editor for the active slide when no element is selected: background and role.
// ---------------------------------------------------------------------------
import * as React from 'react'

import { fileToScaledDataUrl } from '@/lib/carousel/image'
import { type ResolvedTheme } from '@/lib/carousel/theme'
import { type ColorToken, type Slide, type SlideBackground, type SlideRole } from '@/lib/carousel/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { useStoreApi } from '../../use-carousel-store'
import { Field, RangeField, Section, Segmented } from './controls'

const BG_TOKENS: ColorToken[] = ['bg', 'surface', 'accent', 'text']

type BgKind = 'solid' | 'gradient' | 'image'

function kindOf(bg: SlideBackground): BgKind {
    if (bg.type === 'image') return 'image'
    if (bg.type === 'gradient') return 'gradient'
    return 'solid'
}

export function SlideInspector({ slide, theme }: { slide: Slide; theme: ResolvedTheme }) {
    const store = useStoreApi()
    const fileRef = React.useRef<HTMLInputElement>(null)
    const bg = slide.background
    const kind = kindOf(bg)
    const set = (next: SlideBackground) => store.setSlideBackground(slide.id, next)

    const grad = bg.type === 'gradient' && bg.value !== 'hero' ? parseGradient(bg.value) : ['#0A66C2', '#004182']

    const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        set({ type: 'image', src: await fileToScaledDataUrl(file), fit: 'cover' })
        e.target.value = ''
    }

    return (
        <>
            <Section title='Slide role'>
                <Segmented
                    value={slide.role}
                    onChange={(v: SlideRole) => store.setSlideRole(slide.id, v)}
                    options={[
                        { value: 'hook', label: 'Hook' },
                        { value: 'body', label: 'Body' },
                        { value: 'cta', label: 'CTA' },
                    ]}
                />
            </Section>

            <Section title='Background'>
                <div className='mb-2'>
                    <Segmented
                        value={kind}
                        onChange={(v: BgKind) => {
                            if (v === 'solid') set({ type: 'token', token: 'bg' })
                            else if (v === 'gradient') set({ type: 'gradient', value: 'hero' })
                            else fileRef.current?.click()
                        }}
                        options={[
                            { value: 'solid', label: 'Solid' },
                            { value: 'gradient', label: 'Gradient' },
                            { value: 'image', label: 'Image' },
                        ]}
                    />
                </div>
                <input ref={fileRef} type='file' accept='image/*' className='hidden' onChange={handleImage} />

                {kind === 'solid' ? (
                    <div className='flex flex-wrap items-center gap-1.5'>
                        {BG_TOKENS.map((t) => (
                            <button
                                key={t}
                                type='button'
                                title={t}
                                onClick={() => set({ type: 'token', token: t })}
                                className={cn(
                                    'size-7 rounded-full border transition-transform hover:scale-110',
                                    bg.type === 'token' && bg.token === t
                                        ? 'ring-primary ring-2 ring-offset-1'
                                        : 'border-border',
                                )}
                                style={{ background: theme.colors[t] }}
                            />
                        ))}
                        <label
                            className={cn(
                                'relative size-7 overflow-hidden rounded-full border',
                                bg.type === 'color' ? 'ring-primary ring-2 ring-offset-1' : 'border-border',
                            )}
                            title='Custom'
                            style={{ background: bg.type === 'color' ? bg.value : '#888' }}>
                            <input
                                type='color'
                                value={bg.type === 'color' ? bg.value : '#888888'}
                                onChange={(e) => set({ type: 'color', value: e.target.value })}
                                className='absolute inset-0 cursor-pointer opacity-0'
                            />
                        </label>
                    </div>
                ) : null}

                {kind === 'gradient' ? (
                    <div className='space-y-2'>
                        <Button
                            variant={bg.type === 'gradient' && bg.value === 'hero' ? 'default' : 'outline'}
                            size='sm'
                            className='w-full'
                            onClick={() => set({ type: 'gradient', value: 'hero' })}>
                            Theme gradient
                        </Button>
                        <div className='flex items-center justify-between gap-2'>
                            <span className='text-muted-foreground text-xs'>Custom</span>
                            <div className='flex gap-1.5'>
                                <GradientStop
                                    value={grad[0]}
                                    onChange={(c) => set({ type: 'gradient', value: buildGradient(c, grad[1]) })}
                                />
                                <GradientStop
                                    value={grad[1]}
                                    onChange={(c) => set({ type: 'gradient', value: buildGradient(grad[0], c) })}
                                />
                            </div>
                        </div>
                    </div>
                ) : null}

                {kind === 'image' && bg.type === 'image' ? (
                    <div className='space-y-2'>
                        <Button variant='outline' size='sm' className='w-full' onClick={() => fileRef.current?.click()}>
                            Replace image
                        </Button>
                        <Field label='Fit'>
                            <Segmented
                                value={bg.fit}
                                onChange={(v) => set({ ...bg, fit: v })}
                                options={[
                                    { value: 'cover', label: 'Cover' },
                                    { value: 'contain', label: 'Contain' },
                                ]}
                            />
                        </Field>
                        <Field label='Dark overlay'>
                            <RangeField
                                value={overlayAlpha(bg.overlay)}
                                min={0}
                                max={0.8}
                                onChange={(v) =>
                                    set({ ...bg, overlay: v > 0 ? `rgba(0,0,0,${v.toFixed(2)})` : undefined })
                                }
                            />
                        </Field>
                    </div>
                ) : null}
            </Section>
        </>
    )
}

function GradientStop({ value, onChange }: { value: string; onChange: (c: string) => void }) {
    return (
        <label
            className='border-border relative size-7 overflow-hidden rounded-full border'
            style={{ background: value }}>
            <input
                type='color'
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className='absolute inset-0 cursor-pointer opacity-0'
            />
        </label>
    )
}

function buildGradient(a: string, b: string): string {
    return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`
}

function parseGradient(value: string): [string, string] {
    const matches = value.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g)
    if (matches && matches.length >= 2) return [matches[0], matches[1]]
    return ['#0A66C2', '#004182']
}

function overlayAlpha(overlay?: string): number {
    if (!overlay) return 0
    const m = overlay.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/)
    return m ? Number(m[1]) : 0
}
