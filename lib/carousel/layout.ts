// ---------------------------------------------------------------------------
// Layout + guardrail helpers (pure, no DOM).
//
// Auto-fit shrink is applied at render time by the text element (it needs to
// measure the DOM); here we keep the pure geometry + the soft design
// guardrails LinkedIn carousels benefit from. Guardrails are warnings, never
// hard blocks, so the canvas stays free.
// ---------------------------------------------------------------------------

import {
    isTextElement,
    MIN_BODY_FONT,
    SAFE_MARGIN,
    SLIDE_LIMITS,
    type CanvasSize,
    type CarouselDocument,
} from '@/lib/carousel/types'

export type Rect = { x: number; y: number; width: number; height: number }

export function getSafeArea(canvas: CanvasSize): Rect {
    return {
        x: SAFE_MARGIN,
        y: SAFE_MARGIN,
        width: canvas.width - SAFE_MARGIN * 2,
        height: canvas.height - SAFE_MARGIN * 2,
    }
}

export type Guardrail = {
    level: 'info' | 'warn'
    message: string
    /** Slide index the warning concerns, or null for deck-level. */
    slide: number | null
}

/** Soft design checks surfaced in the editor; nothing here blocks export. */
export function analyzeDocument(doc: CarouselDocument): Guardrail[] {
    const out: Guardrail[] = []
    const count = doc.slides.length

    if (count < SLIDE_LIMITS.min) {
        out.push({ level: 'warn', message: `Carousels need at least ${SLIDE_LIMITS.min} slides.`, slide: null })
    }
    if (count > SLIDE_LIMITS.softMax) {
        out.push({
            level: 'warn',
            message: `${count} slides - engagement usually drops after ${SLIDE_LIMITS.sweetSpot}. Consider trimming.`,
            slide: null,
        })
    }

    doc.slides.forEach((slide, i) => {
        let words = 0
        slide.elements.forEach((el) => {
            if (!isTextElement(el)) return
            words += el.text.trim() ? el.text.trim().split(/\s+/).length : 0
            if (el.fontSize < MIN_BODY_FONT && el.text.trim()) {
                out.push({
                    level: 'info',
                    message: `Slide ${i + 1}: text below ${MIN_BODY_FONT}px can be hard to read on mobile.`,
                    slide: i,
                })
            }
        })
        if (words > 60) {
            out.push({
                level: 'info',
                message: `Slide ${i + 1}: ${words} words - one idea per slide reads best (aim under ~60).`,
                slide: i,
            })
        }
    })

    return out
}

/**
 * Estimate a font size that fits `text` inside a box. A coarse pre-fit so newly
 * created/AI elements start close; the text element refines exactly at render.
 */
export function estimateFitFontSize(text: string, box: Rect, baseFontSize: number, lineHeight: number): number {
    if (!text.trim()) return baseFontSize
    const chars = text.length
    // Rough average glyph advance ~0.52em for the sans stacks we ship.
    const charsPerLine = Math.max(1, Math.floor(box.width / (baseFontSize * 0.52)))
    const lines = Math.max(text.split('\n').length, Math.ceil(chars / charsPerLine))
    const neededHeight = lines * baseFontSize * lineHeight
    if (neededHeight <= box.height) return baseFontSize
    const scaled = Math.floor(baseFontSize * (box.height / neededHeight))
    return Math.max(MIN_BODY_FONT - 4, scaled)
}
