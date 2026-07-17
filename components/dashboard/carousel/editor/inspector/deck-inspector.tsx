'use client'

// ---------------------------------------------------------------------------
// Deck-level controls shown when nothing is selected: theme, aspect ratio, and
// the persistent branding chrome (footer identity, page numbers, swipe cue).
// ---------------------------------------------------------------------------
import * as React from 'react'

import { fileToScaledDataUrl } from '@/lib/carousel/image'
import { THEMES } from '@/lib/carousel/theme'
import { type BrandChrome, type CanvasRatio } from '@/lib/carousel/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

import { useStoreApi } from '../../use-carousel-store'
import { Field, Section, Segmented } from './controls'

export function DeckInspector({
    themeId,
    ratio,
    chrome,
}: {
    themeId: string
    ratio: CanvasRatio
    chrome: BrandChrome
}) {
    const store = useStoreApi()
    const avatarRef = React.useRef<HTMLInputElement>(null)

    const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        store.setBrandChrome({ avatarUrl: await fileToScaledDataUrl(file, 256) })
        e.target.value = ''
    }

    return (
        <>
            <Section title='Theme'>
                <div className='grid grid-cols-3 gap-2'>
                    {THEMES.map((t) => (
                        <button
                            key={t.id}
                            type='button'
                            title={t.name}
                            onClick={() => store.setTheme(t.id)}
                            className={cn(
                                'group/theme relative overflow-hidden rounded-lg border-2 transition-colors',
                                themeId === t.id ? 'border-primary' : 'hover:border-border border-transparent',
                            )}>
                            <div className='flex h-12 flex-col justify-end p-1.5' style={{ background: t.colors.bg }}>
                                <span className='text-[13px] leading-none font-bold' style={{ color: t.colors.text }}>
                                    Aa
                                </span>
                                <span className='mt-1 h-1.5 w-6 rounded-full' style={{ background: t.colors.accent }} />
                            </div>
                            <span className='text-muted-foreground block truncate px-1 py-0.5 text-[10px]'>
                                {t.name}
                            </span>
                        </button>
                    ))}
                </div>
            </Section>

            <Section title='Aspect ratio'>
                <Segmented
                    value={ratio}
                    onChange={(v: CanvasRatio) => store.setCanvasRatio(v)}
                    options={[
                        { value: '4:5', label: '4:5' },
                        { value: '1:1', label: '1:1' },
                        { value: '16:9', label: '16:9' },
                    ]}
                />
            </Section>

            <Section title='Branding'>
                <Field label='Footer'>
                    <Switch checked={chrome.footer} onCheckedChange={(v) => store.setBrandChrome({ footer: v })} />
                </Field>
                <Field label='Page numbers'>
                    <Switch
                        checked={chrome.pageNumbers}
                        onCheckedChange={(v) => store.setBrandChrome({ pageNumbers: v })}
                    />
                </Field>
                <Field label='Swipe cue'>
                    <Switch checked={chrome.swipeCue} onCheckedChange={(v) => store.setBrandChrome({ swipeCue: v })} />
                </Field>
                <div className='mt-2 space-y-2'>
                    <Input
                        value={chrome.name}
                        onChange={(e) => store.setBrandChrome({ name: e.target.value })}
                        placeholder='Your name'
                        className='h-8 text-sm'
                    />
                    <Input
                        value={chrome.handle}
                        onChange={(e) => store.setBrandChrome({ handle: e.target.value })}
                        placeholder='@handle'
                        className='h-8 text-sm'
                    />
                    <div className='flex items-center gap-2'>
                        <input
                            ref={avatarRef}
                            type='file'
                            accept='image/*'
                            className='hidden'
                            onChange={handleAvatar}
                        />
                        {chrome.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={chrome.avatarUrl} alt='' className='size-8 rounded-full object-cover' />
                        ) : (
                            <div className='bg-muted size-8 rounded-full' />
                        )}
                        <Button
                            variant='outline'
                            size='sm'
                            className='flex-1'
                            onClick={() => avatarRef.current?.click()}>
                            {chrome.avatarUrl ? 'Change avatar' : 'Add avatar'}
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    )
}
