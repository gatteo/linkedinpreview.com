'use client'

// ---------------------------------------------------------------------------
// Property editor for the single selected element: type-specific controls plus
// a shared Arrange section (size/position/rotation/opacity/layering/lock).
// Edits flow through updateSelectedElements so they apply to the active
// selection; opacity drags are batched into one undo step.
// ---------------------------------------------------------------------------
import * as React from 'react'
import { ChevronDownIcon, ChevronsDownIcon, ChevronsUpIcon, ChevronUpIcon, CopyIcon, Trash2Icon } from 'lucide-react'

import { fileToScaledDataUrl } from '@/lib/carousel/image'
import { type ResolvedTheme } from '@/lib/carousel/theme'
import { type CarouselElement } from '@/lib/carousel/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

import { useStoreApi } from '../../use-carousel-store'
import { SlideAiActions } from '../ai/slide-ai-actions'
import { ColorField, Field, NumberField, RangeField, Section, Segmented } from './controls'
import { IconPicker } from './icon-picker'

export function ElementInspector({
    slideId,
    el,
    theme,
}: {
    slideId: string
    el: CarouselElement
    theme: ResolvedTheme
}) {
    const store = useStoreApi()
    const update = (patch: Partial<CarouselElement>) => store.updateSelectedElements(patch)

    return (
        <div>
            {el.type === 'text' ? <SlideAiActions slideId={slideId} el={el} /> : null}
            {el.type === 'text' ? <TextControls el={el} theme={theme} update={update} /> : null}
            {el.type === 'image' ? <ImageControls el={el} update={update} /> : null}
            {el.type === 'shape' ? <ShapeControls el={el} theme={theme} update={update} /> : null}
            {el.type === 'icon' ? <IconControls el={el} theme={theme} update={update} /> : null}

            <Section title='Arrange'>
                <Field label='Opacity'>
                    <RangeField
                        value={el.opacity}
                        onChange={(v) => update({ opacity: v })}
                        onCommitStart={store.beginBatch}
                        onCommitEnd={store.endBatch}
                    />
                </Field>
                <Field label='Rotation'>
                    <NumberField value={el.rotation} onChange={(v) => update({ rotation: v })} step={1} suffix='°' />
                </Field>
                <Field label='Position'>
                    <div className='flex gap-1.5'>
                        <NumberField value={el.x} onChange={(v) => update({ x: v })} suffix='X' />
                        <NumberField value={el.y} onChange={(v) => update({ y: v })} suffix='Y' />
                    </div>
                </Field>
                <Field label='Size'>
                    <div className='flex gap-1.5'>
                        <NumberField value={el.width} onChange={(v) => update({ width: v })} min={8} suffix='W' />
                        <NumberField value={el.height} onChange={(v) => update({ height: v })} min={8} suffix='H' />
                    </div>
                </Field>
                <Field label='Layer'>
                    <div className='flex gap-0.5'>
                        <LayerButton
                            label='Bring to front'
                            onClick={() => store.reorderElement(slideId, el.id, 'front')}>
                            <ChevronsUpIcon className='size-4' />
                        </LayerButton>
                        <LayerButton
                            label='Bring forward'
                            onClick={() => store.reorderElement(slideId, el.id, 'forward')}>
                            <ChevronUpIcon className='size-4' />
                        </LayerButton>
                        <LayerButton
                            label='Send backward'
                            onClick={() => store.reorderElement(slideId, el.id, 'backward')}>
                            <ChevronDownIcon className='size-4' />
                        </LayerButton>
                        <LayerButton label='Send to back' onClick={() => store.reorderElement(slideId, el.id, 'back')}>
                            <ChevronsDownIcon className='size-4' />
                        </LayerButton>
                    </div>
                </Field>
                <Field label='Lock'>
                    <Switch checked={!!el.locked} onCheckedChange={(v) => update({ locked: v })} />
                </Field>
                <div className='mt-2 flex gap-2'>
                    <Button
                        variant='outline'
                        size='sm'
                        className='flex-1'
                        onClick={() => store.duplicateElement(slideId, el.id)}>
                        <CopyIcon className='size-3.5' />
                        Duplicate
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        className='hover:text-destructive flex-1'
                        onClick={() => store.deleteElement(slideId, el.id)}>
                        <Trash2Icon className='size-3.5' />
                        Delete
                    </Button>
                </div>
            </Section>
        </div>
    )
}

function LayerButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <Button variant='outline' size='icon-sm' aria-label={label} title={label} onClick={onClick}>
            {children}
        </Button>
    )
}

type UpdateFn = (patch: Partial<CarouselElement>) => void

function TextControls({
    el,
    theme,
    update,
}: {
    el: Extract<CarouselElement, { type: 'text' }>
    theme: ResolvedTheme
    update: UpdateFn
}) {
    return (
        <Section title='Text'>
            <Field label='Font'>
                <Segmented
                    value={el.fontToken}
                    onChange={(v) => update({ fontToken: v })}
                    options={[
                        { value: 'heading', label: 'Heading' },
                        { value: 'body', label: 'Body' },
                    ]}
                />
            </Field>
            <Field label='Size'>
                <NumberField
                    value={el.fontSize}
                    onChange={(v) => update({ fontSize: v })}
                    min={8}
                    max={400}
                    suffix='px'
                />
            </Field>
            <Field label='Weight'>
                <Segmented
                    value={String(el.fontWeight)}
                    onChange={(v) => update({ fontWeight: Number(v) })}
                    options={[
                        { value: '400', label: 'R' },
                        { value: '600', label: 'M' },
                        { value: '700', label: 'B' },
                        { value: '800', label: 'H' },
                    ]}
                />
            </Field>
            <Field label='Align'>
                <Segmented
                    value={el.align}
                    onChange={(v) => update({ align: v })}
                    options={[
                        { value: 'left', label: 'L' },
                        { value: 'center', label: 'C' },
                        { value: 'right', label: 'R' },
                    ]}
                />
            </Field>
            <Field label='Vertical'>
                <Segmented
                    value={el.valign}
                    onChange={(v) => update({ valign: v })}
                    options={[
                        { value: 'top', label: 'Top' },
                        { value: 'middle', label: 'Mid' },
                        { value: 'bottom', label: 'Btm' },
                    ]}
                />
            </Field>
            <Field label='Line height'>
                <NumberField
                    value={el.lineHeight}
                    onChange={(v) => update({ lineHeight: v })}
                    min={0.8}
                    max={3}
                    step={0.05}
                />
            </Field>
            <Field label='Letter spacing'>
                <NumberField
                    value={el.letterSpacing}
                    onChange={(v) => update({ letterSpacing: v })}
                    step={0.5}
                    suffix='px'
                />
            </Field>
            <Field label='Auto-fit'>
                <Switch
                    checked={el.autoFit === 'shrink'}
                    onCheckedChange={(v) => update({ autoFit: v ? 'shrink' : 'none' })}
                />
            </Field>
            <Field label='Color'>
                <ColorField theme={theme} token={el.colorToken} color={el.color} onChange={(c) => update(c)} />
            </Field>
        </Section>
    )
}

function ImageControls({ el, update }: { el: Extract<CarouselElement, { type: 'image' }>; update: UpdateFn }) {
    const fileRef = React.useRef<HTMLInputElement>(null)
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const src = await fileToScaledDataUrl(file)
        update({ src })
        e.target.value = ''
    }
    return (
        <Section title='Image'>
            <input ref={fileRef} type='file' accept='image/*' className='hidden' onChange={handleFile} />
            <Button variant='outline' size='sm' className='mb-2 w-full' onClick={() => fileRef.current?.click()}>
                {el.src ? 'Replace image' : 'Upload image'}
            </Button>
            <Field label='Fit'>
                <Segmented
                    value={el.fit}
                    onChange={(v) => update({ fit: v })}
                    options={[
                        { value: 'cover', label: 'Cover' },
                        { value: 'contain', label: 'Contain' },
                    ]}
                />
            </Field>
            <Field label='Corner radius'>
                <NumberField value={el.radius} onChange={(v) => update({ radius: v })} min={0} suffix='px' />
            </Field>
            <div className='pt-1'>
                <span className='text-muted-foreground text-xs'>Alt text</span>
                <Input
                    value={el.alt}
                    onChange={(e) => update({ alt: e.target.value })}
                    placeholder='Describe the image'
                    className='mt-1 h-8 text-sm'
                />
            </div>
        </Section>
    )
}

function ShapeControls({
    el,
    theme,
    update,
}: {
    el: Extract<CarouselElement, { type: 'shape' }>
    theme: ResolvedTheme
    update: UpdateFn
}) {
    return (
        <Section title='Shape'>
            <Field label='Type'>
                <Segmented
                    value={el.shape}
                    onChange={(v) => update({ shape: v })}
                    options={[
                        { value: 'rect', label: 'Rect' },
                        { value: 'ellipse', label: 'Oval' },
                        { value: 'line', label: 'Line' },
                    ]}
                />
            </Field>
            <Field label='Fill'>
                <ColorField
                    theme={theme}
                    token={el.fillToken}
                    color={el.fill}
                    onChange={(c) => update({ fillToken: c.colorToken, fill: c.color })}
                />
            </Field>
            {el.shape === 'rect' ? (
                <Field label='Corner radius'>
                    <NumberField value={el.radius} onChange={(v) => update({ radius: v })} min={0} suffix='px' />
                </Field>
            ) : null}
        </Section>
    )
}

function IconControls({
    el,
    theme,
    update,
}: {
    el: Extract<CarouselElement, { type: 'icon' }>
    theme: ResolvedTheme
    update: UpdateFn
}) {
    return (
        <Section title='Icon'>
            <Field label='Icon'>
                <IconPicker value={el.name} onChange={(name) => update({ name })} />
            </Field>
            <Field label='Color'>
                <ColorField theme={theme} token={el.colorToken} color={el.color} onChange={(c) => update(c)} />
            </Field>
            <Field label='Stroke'>
                <NumberField
                    value={el.strokeWidth}
                    onChange={(v) => update({ strokeWidth: v })}
                    min={1}
                    max={4}
                    step={0.5}
                />
            </Field>
        </Section>
    )
}
