// ---------------------------------------------------------------------------
// Bridges a CarouselDocument to the existing drafts persistence (title + stats
// shown in the sidebar/table) and produces a compact text summary for AI calls.
// Imports only pure types/helpers so it is safe to use from lib/drafts.ts.
// ---------------------------------------------------------------------------

import { isTextElement, type CarouselDocument } from '@/lib/carousel/types'

/** Title for the drafts list: the hook slide's first non-empty line. */
export function carouselTitle(doc: CarouselDocument): string {
    const hook = doc.slides.find((s) => s.role === 'hook') ?? doc.slides[0]
    if (hook) {
        for (const el of hook.elements) {
            if (isTextElement(el) && el.text.trim()) {
                const line = el.text.trim().split('\n')[0]
                return line.length > 60 ? line.slice(0, 57) + '...' : line
            }
        }
    }
    return 'Untitled carousel'
}

/** Char + word counts aggregated across every text element in the deck. */
export function carouselStats(doc: CarouselDocument): { charCount: number; wordCount: number } {
    let charCount = 0
    let wordCount = 0
    for (const slide of doc.slides) {
        for (const el of slide.elements) {
            if (!isTextElement(el)) continue
            const t = el.text.trim()
            if (!t) continue
            charCount += t.length
            wordCount += t.split(/\s+/).length
        }
    }
    return { charCount, wordCount }
}

/** Compact, role-labelled text outline of the deck, fed to AI editing calls. */
export function summarizeDeck(doc: CarouselDocument): string {
    return doc.slides
        .map((slide, i) => {
            const text = slide.elements
                .filter(isTextElement)
                .map((el) => el.text.trim())
                .filter(Boolean)
                .join(' / ')
            return `Slide ${i + 1} [${slide.role}]: ${text || '(no text)'}`
        })
        .join('\n')
}
