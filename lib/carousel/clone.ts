// ---------------------------------------------------------------------------
// Deep-copy helpers that re-id elements/slides so a duplicate is fully
// independent of its source. Elements and slides are plain JSON-serializable
// data, so a structured JSON clone is both correct and cheap.
// ---------------------------------------------------------------------------

import { type CarouselElement, type Slide } from '@/lib/carousel/types'

import { createId } from './factory'

function deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

function idPrefix(type: CarouselElement['type']): string {
    return type === 'text' ? 'txt' : type === 'image' ? 'img' : type === 'shape' ? 'shp' : 'icn'
}

export function duplicateElementOf(el: CarouselElement, offset = 32): CarouselElement {
    const copy = deepClone(el)
    copy.id = createId(idPrefix(el.type))
    copy.x = el.x + offset
    copy.y = el.y + offset
    return copy
}

export function duplicateSlideOf(slide: Slide): Slide {
    const copy = deepClone(slide)
    copy.id = createId('sld')
    copy.elements = copy.elements.map((el) => ({ ...el, id: createId(idPrefix(el.type)) }))
    delete copy.panoramaGroup
    return copy
}
