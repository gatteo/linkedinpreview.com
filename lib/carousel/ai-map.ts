// ---------------------------------------------------------------------------
// Maps the AI generator's slide outline (role + headline + body + suggestedIcon)
// onto a fully laid-out CarouselDocument using role-based layouts and theme
// tokens, so generated decks are immediately on-brand and editable.
// ---------------------------------------------------------------------------

import {
    CANVAS_SIZES,
    CAROUSEL_VERSION,
    type CanvasRatio,
    type CarouselDocument,
    type CarouselElement,
    type Slide,
} from '@/lib/carousel/types'

import { createIconElement, createShapeElement, createSlide, createTextElement, DEFAULT_CHROME } from './factory'
import { DEFAULT_THEME_ID } from './theme'

export type AiSlide = {
    role: 'hook' | 'body' | 'cta'
    headline: string
    body?: string
    suggestedIcon?: string
}

const MARGIN = 88
const CONTENT_W = 904

function buildHookSlide(s: AiSlide): Slide {
    return createSlide(
        'hook',
        [
            createShapeElement({ x: MARGIN, y: 360, width: 120, height: 12, fillToken: 'accentText', radius: 999 }),
            createTextElement({
                text: s.headline,
                x: MARGIN,
                y: 420,
                width: CONTENT_W,
                height: 460,
                fontToken: 'heading',
                fontSize: 90,
                fontWeight: 800,
                lineHeight: 1.05,
                colorToken: 'accentText',
            }),
            ...(s.body
                ? [
                      createTextElement({
                          text: s.body,
                          x: MARGIN,
                          y: 920,
                          width: CONTENT_W,
                          height: 200,
                          fontToken: 'body',
                          fontSize: 38,
                          lineHeight: 1.35,
                          colorToken: 'accentText',
                      }),
                  ]
                : []),
        ],
        { type: 'gradient', value: 'hero' },
    )
}

function buildBodySlide(s: AiSlide): Slide {
    const hasIcon = !!s.suggestedIcon
    const headlineY = hasIcon ? 250 : 150
    const elements: CarouselElement[] = [
        createTextElement({
            text: s.headline,
            x: MARGIN,
            y: headlineY,
            width: CONTENT_W,
            height: 220,
            fontToken: 'heading',
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.1,
            colorToken: 'text',
        }),
    ]
    if (hasIcon) {
        elements.unshift(
            createIconElement({
                name: s.suggestedIcon!,
                x: MARGIN,
                y: 120,
                width: 88,
                height: 88,
                colorToken: 'accent',
            }),
        )
    }
    if (s.body) {
        elements.push(
            createTextElement({
                text: s.body,
                x: MARGIN,
                y: headlineY + 240,
                width: CONTENT_W,
                height: 640,
                fontToken: 'body',
                fontSize: 40,
                lineHeight: 1.4,
                colorToken: 'muted',
            }),
        )
    }
    return createSlide('body', elements, { type: 'token', token: 'bg' })
}

function buildCtaSlide(s: AiSlide): Slide {
    return createSlide(
        'cta',
        [
            createTextElement({
                text: s.headline,
                x: MARGIN,
                y: 440,
                width: CONTENT_W,
                height: 380,
                fontToken: 'heading',
                fontSize: 76,
                fontWeight: 800,
                lineHeight: 1.08,
                colorToken: 'accentText',
            }),
            ...(s.body
                ? [
                      createTextElement({
                          text: s.body,
                          x: MARGIN,
                          y: 860,
                          width: CONTENT_W,
                          height: 220,
                          fontToken: 'body',
                          fontSize: 38,
                          lineHeight: 1.35,
                          colorToken: 'accentText',
                      }),
                  ]
                : []),
        ],
        { type: 'gradient', value: 'hero' },
    )
}

export function documentFromAiSlides(
    aiSlides: AiSlide[],
    opts: { themeId?: string; ratio?: CanvasRatio; brand?: Partial<CarouselDocument['brandChrome']> } = {},
): CarouselDocument {
    const ratio = opts.ratio ?? '4:5'
    const slides = aiSlides.map((s) =>
        s.role === 'hook' ? buildHookSlide(s) : s.role === 'cta' ? buildCtaSlide(s) : buildBodySlide(s),
    )
    return {
        kind: 'carousel',
        version: CAROUSEL_VERSION,
        canvas: CANVAS_SIZES[ratio],
        themeId: opts.themeId ?? DEFAULT_THEME_ID,
        brandChrome: { ...DEFAULT_CHROME, ...opts.brand },
        slides: slides.length ? slides : [buildHookSlide({ role: 'hook', headline: 'Your idea' })],
    }
}
