// ---------------------------------------------------------------------------
// Construction helpers for carousel documents, slides, and elements.
//
// Everything that builds a CarouselDocument (the blank-deck starter, templates,
// AI mapping, paste/duplicate) goes through these so defaults stay consistent.
// ---------------------------------------------------------------------------

import {
    CANVAS_SIZES,
    CAROUSEL_VERSION,
    type CanvasRatio,
    type CarouselDocument,
    type CarouselElement,
    type IconElement,
    type ImageElement,
    type ShapeElement,
    type Slide,
    type SlideBackground,
    type SlideRole,
    type TextElement,
} from '@/lib/carousel/types'

import { DEFAULT_THEME_ID } from './theme'
import { tiptapFromText } from './tiptap'

let counter = 0

/** Short, collision-resistant id. Avoids crypto for sync use in render paths. */
export function createId(prefix = 'el'): string {
    counter += 1
    const rand = Math.random().toString(36).slice(2, 8)
    return `${prefix}_${counter.toString(36)}${rand}`
}

type TextOpts = Partial<Omit<TextElement, 'type' | 'id'>> & { text?: string }

export function createTextElement(opts: TextOpts = {}): TextElement {
    const text = opts.text ?? ''
    return {
        id: createId('txt'),
        type: 'text',
        x: opts.x ?? 88,
        y: opts.y ?? 200,
        width: opts.width ?? 904,
        height: opts.height ?? 160,
        rotation: opts.rotation ?? 0,
        opacity: opts.opacity ?? 1,
        zIndex: opts.zIndex ?? 1,
        locked: opts.locked,
        text,
        html: opts.html ?? tiptapFromText(text),
        fontToken: opts.fontToken ?? 'body',
        fontSize: opts.fontSize ?? 40,
        fontWeight: opts.fontWeight ?? 400,
        lineHeight: opts.lineHeight ?? 1.3,
        letterSpacing: opts.letterSpacing ?? 0,
        align: opts.align ?? 'left',
        valign: opts.valign ?? 'top',
        colorToken: opts.colorToken ?? 'text',
        color: opts.color,
        autoFit: opts.autoFit ?? 'shrink',
    }
}

type ImageOpts = Partial<Omit<ImageElement, 'type' | 'id'>>

export function createImageElement(opts: ImageOpts = {}): ImageElement {
    return {
        id: createId('img'),
        type: 'image',
        x: opts.x ?? 240,
        y: opts.y ?? 400,
        width: opts.width ?? 600,
        height: opts.height ?? 600,
        rotation: opts.rotation ?? 0,
        opacity: opts.opacity ?? 1,
        zIndex: opts.zIndex ?? 1,
        locked: opts.locked,
        src: opts.src ?? '',
        fit: opts.fit ?? 'cover',
        radius: opts.radius ?? 24,
        alt: opts.alt ?? '',
    }
}

type ShapeOpts = Partial<Omit<ShapeElement, 'type' | 'id'>>

export function createShapeElement(opts: ShapeOpts = {}): ShapeElement {
    return {
        id: createId('shp'),
        type: 'shape',
        x: opts.x ?? 88,
        y: opts.y ?? 600,
        width: opts.width ?? 200,
        height: opts.height ?? 8,
        rotation: opts.rotation ?? 0,
        opacity: opts.opacity ?? 1,
        zIndex: opts.zIndex ?? 1,
        locked: opts.locked,
        shape: opts.shape ?? 'rect',
        fillToken: opts.fillToken ?? 'accent',
        fill: opts.fill,
        stroke: opts.stroke,
        strokeWidth: opts.strokeWidth ?? 0,
        radius: opts.radius ?? 999,
    }
}

type IconOpts = Partial<Omit<IconElement, 'type' | 'id'>>

export function createIconElement(opts: IconOpts = {}): IconElement {
    return {
        id: createId('icn'),
        type: 'icon',
        x: opts.x ?? 88,
        y: opts.y ?? 200,
        width: opts.width ?? 96,
        height: opts.height ?? 96,
        rotation: opts.rotation ?? 0,
        opacity: opts.opacity ?? 1,
        zIndex: opts.zIndex ?? 1,
        locked: opts.locked,
        name: opts.name ?? 'sparkles',
        colorToken: opts.colorToken ?? 'accent',
        color: opts.color,
        strokeWidth: opts.strokeWidth ?? 2,
    }
}

export function createSlide(
    role: SlideRole = 'body',
    elements: CarouselElement[] = [],
    background?: SlideBackground,
): Slide {
    return {
        id: createId('sld'),
        role,
        background: background ?? { type: 'token', token: 'bg' },
        elements,
    }
}

export type NewDocumentOpts = {
    themeId?: string
    ratio?: CanvasRatio
    brand?: Partial<CarouselDocument['brandChrome']>
}

const DEFAULT_CHROME: CarouselDocument['brandChrome'] = {
    footer: true,
    pageNumbers: true,
    swipeCue: true,
    avatarUrl: '',
    name: '',
    handle: '',
}

/** A minimal one-slide starter deck (a hook slide) for a brand-new carousel. */
export function blankDocument(opts: NewDocumentOpts = {}): CarouselDocument {
    const ratio = opts.ratio ?? '4:5'
    const hook = createSlide(
        'hook',
        [
            createTextElement({
                text: 'Your big idea goes here',
                y: 460,
                height: 320,
                fontToken: 'heading',
                fontSize: 92,
                fontWeight: 800,
                lineHeight: 1.05,
                colorToken: 'accentText',
            }),
            createTextElement({
                text: 'A short supporting line that earns the swipe.',
                y: 800,
                height: 140,
                fontToken: 'body',
                fontSize: 36,
                colorToken: 'accentText',
            }),
        ],
        { type: 'gradient', value: 'hero' },
    )
    return {
        kind: 'carousel',
        version: CAROUSEL_VERSION,
        canvas: CANVAS_SIZES[ratio],
        themeId: opts.themeId ?? DEFAULT_THEME_ID,
        brandChrome: { ...DEFAULT_CHROME, ...opts.brand },
        slides: [hook],
    }
}

export { DEFAULT_CHROME }
