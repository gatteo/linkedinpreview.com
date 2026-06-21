// ---------------------------------------------------------------------------
// Carousel editor store
//
// A tiny, framework-agnostic store (subscribe / getSnapshot / actions) consumed
// by React via useSyncExternalStore in components/dashboard/carousel/
// use-carousel-store.tsx. Deliberately NOT a global state library: each editor
// instance owns one store, handed down through Context.
//
// History: doc mutations are batched. A standalone action is its own undo step;
// a pointer gesture wraps many mutations in begin/endBatch so the whole drag is
// one undo step. Immutable updates preserve referential identity of untouched
// slides/elements, so selector subscribers only re-render when their slice
// actually changes.
// ---------------------------------------------------------------------------

import {
    CANVAS_SIZES,
    type CanvasRatio,
    type CarouselDocument,
    type CarouselElement,
    type Slide,
    type SlideBackground,
    type SlideRole,
    type ThemeOverrides,
} from '@/lib/carousel/types'

import { duplicateElementOf, duplicateSlideOf } from './clone'
import { createSlide } from './factory'

export type EditorSnapshot = {
    doc: CarouselDocument
    selectedSlideId: string | null
    selectedElementIds: string[]
    canUndo: boolean
    canRedo: boolean
}

export type CarouselStore = ReturnType<typeof createCarouselStore>

const HISTORY_LIMIT = 100

export function createCarouselStore(initialDoc: CarouselDocument) {
    let doc = initialDoc
    let selectedSlideId: string | null = initialDoc.slides[0]?.id ?? null
    let selectedElementIds: string[] = []
    let past: CarouselDocument[] = []
    let future: CarouselDocument[] = []

    // Batching
    let batchDepth = 0
    let checkpoint: CarouselDocument | null = null

    // Cached immutable snapshot (referentially stable until something changes).
    let snapshot: EditorSnapshot = buildSnapshot()
    const listeners = new Set<() => void>()

    function buildSnapshot(): EditorSnapshot {
        return {
            doc,
            selectedSlideId,
            selectedElementIds,
            canUndo: past.length > 0,
            canRedo: future.length > 0,
        }
    }

    function emit() {
        snapshot = buildSnapshot()
        listeners.forEach((l) => l())
    }

    function beginBatch() {
        if (batchDepth === 0) checkpoint = doc
        batchDepth += 1
    }

    function endBatch() {
        batchDepth = Math.max(0, batchDepth - 1)
        if (batchDepth === 0 && checkpoint && checkpoint !== doc) {
            past = [...past, checkpoint].slice(-HISTORY_LIMIT)
            future = []
            checkpoint = null
            emit()
        } else {
            checkpoint = null
        }
    }

    /** Apply an immutable producer to the doc, recording history unless batched. */
    function mutate(producer: (d: CarouselDocument) => CarouselDocument) {
        const standalone = batchDepth === 0
        if (standalone) beginBatch()
        doc = producer(doc)
        if (standalone) endBatch()
        else emit()
    }

    function reconcileSelection() {
        const slide = doc.slides.find((s) => s.id === selectedSlideId)
        if (!slide) {
            selectedSlideId = doc.slides[0]?.id ?? null
            selectedElementIds = []
            return
        }
        const ids = new Set(slide.elements.map((e) => e.id))
        selectedElementIds = selectedElementIds.filter((id) => ids.has(id))
    }

    // -- selection -----------------------------------------------------------

    function selectSlide(id: string | null) {
        if (id === selectedSlideId) return
        selectedSlideId = id
        selectedElementIds = []
        emit()
    }

    function selectElements(ids: string[]) {
        selectedElementIds = ids
        emit()
    }

    function toggleElement(id: string, additive: boolean) {
        if (additive) {
            selectedElementIds = selectedElementIds.includes(id)
                ? selectedElementIds.filter((x) => x !== id)
                : [...selectedElementIds, id]
        } else {
            selectedElementIds = [id]
        }
        emit()
    }

    function clearElementSelection() {
        if (selectedElementIds.length === 0) return
        selectedElementIds = []
        emit()
    }

    // -- history -------------------------------------------------------------

    function undo() {
        if (!past.length) return
        future = [doc, ...future].slice(0, HISTORY_LIMIT)
        doc = past[past.length - 1]
        past = past.slice(0, -1)
        reconcileSelection()
        emit()
    }

    function redo() {
        if (!future.length) return
        past = [...past, doc].slice(-HISTORY_LIMIT)
        doc = future[0]
        future = future.slice(1)
        reconcileSelection()
        emit()
    }

    // -- document-level ------------------------------------------------------

    function loadDocument(next: CarouselDocument, opts: { resetHistory?: boolean } = {}) {
        mutate(() => next)
        if (opts.resetHistory) {
            past = []
            future = []
        }
        reconcileSelection()
        if (!doc.slides.find((s) => s.id === selectedSlideId)) selectedSlideId = doc.slides[0]?.id ?? null
        emit()
    }

    function setTheme(themeId: string) {
        mutate((d) => ({ ...d, themeId }))
    }

    function setThemeOverrides(overrides: ThemeOverrides | undefined) {
        mutate((d) => ({ ...d, themeOverrides: overrides }))
    }

    function setCanvasRatio(ratio: CanvasRatio) {
        const next = CANVAS_SIZES[ratio]
        mutate((d) => {
            const fx = next.width / d.canvas.width
            const fy = next.height / d.canvas.height
            if (fx === 1 && fy === 1) return { ...d, canvas: next }
            // Re-layout every element proportionally so nothing is clipped or
            // stranded when the artboard changes shape.
            const slides = d.slides.map((s) => ({
                ...s,
                elements: s.elements.map((el): CarouselElement => {
                    const geo = {
                        x: Math.round(el.x * fx),
                        y: Math.round(el.y * fy),
                        width: Math.round(el.width * fx),
                        height: Math.round(el.height * fy),
                    }
                    if (el.type === 'text') return { ...el, ...geo, fontSize: Math.round(el.fontSize * fx) }
                    return { ...el, ...geo }
                }),
            }))
            return { ...d, canvas: next, slides }
        })
    }

    function setBrandChrome(patch: Partial<CarouselDocument['brandChrome']>) {
        mutate((d) => ({ ...d, brandChrome: { ...d.brandChrome, ...patch } }))
    }

    // -- slides --------------------------------------------------------------

    function slideIndex(id: string) {
        return doc.slides.findIndex((s) => s.id === id)
    }

    function addSlide(role: SlideRole = 'body', afterId?: string | null): string {
        const slide = createSlide(role)
        mutate((d) => {
            const idx = afterId ? d.slides.findIndex((s) => s.id === afterId) : d.slides.length - 1
            const at = idx < 0 ? d.slides.length : idx + 1
            const slides = [...d.slides.slice(0, at), slide, ...d.slides.slice(at)]
            return { ...d, slides }
        })
        selectedSlideId = slide.id
        selectedElementIds = []
        emit()
        return slide.id
    }

    function insertSlide(slide: Slide, afterId?: string | null) {
        mutate((d) => {
            const idx = afterId ? d.slides.findIndex((s) => s.id === afterId) : d.slides.length - 1
            const at = idx < 0 ? d.slides.length : idx + 1
            return { ...d, slides: [...d.slides.slice(0, at), slide, ...d.slides.slice(at)] }
        })
        selectedSlideId = slide.id
        selectedElementIds = []
        emit()
    }

    function deleteSlide(id: string) {
        if (doc.slides.length <= 1) return
        const idx = slideIndex(id)
        mutate((d) => ({ ...d, slides: d.slides.filter((s) => s.id !== id) }))
        if (selectedSlideId === id) {
            const next = doc.slides[Math.min(idx, doc.slides.length - 1)]
            selectedSlideId = next?.id ?? null
            selectedElementIds = []
        }
        emit()
    }

    function duplicateSlide(id: string) {
        const source = doc.slides.find((s) => s.id === id)
        if (!source) return
        const copy = duplicateSlideOf(source)
        insertSlide(copy, id)
    }

    function moveSlide(fromIndex: number, toIndex: number) {
        if (fromIndex === toIndex) return
        mutate((d) => {
            const slides = [...d.slides]
            const [moved] = slides.splice(fromIndex, 1)
            slides.splice(toIndex, 0, moved)
            return { ...d, slides }
        })
    }

    function setSlideRole(id: string, role: SlideRole) {
        mutate((d) => ({ ...d, slides: d.slides.map((s) => (s.id === id ? { ...s, role } : s)) }))
    }

    function setSlideBackground(id: string, background: SlideBackground) {
        mutate((d) => ({ ...d, slides: d.slides.map((s) => (s.id === id ? { ...s, background } : s)) }))
    }

    // -- elements ------------------------------------------------------------

    function mapSlideElements(slideId: string, fn: (els: CarouselElement[]) => CarouselElement[]) {
        mutate((d) => ({
            ...d,
            slides: d.slides.map((s) => (s.id === slideId ? { ...s, elements: fn(s.elements) } : s)),
        }))
    }

    function addElement(slideId: string, element: CarouselElement) {
        const maxZ = Math.max(0, ...(doc.slides.find((s) => s.id === slideId)?.elements.map((e) => e.zIndex) ?? [0]))
        const withZ = { ...element, zIndex: maxZ + 1 }
        mapSlideElements(slideId, (els) => [...els, withZ])
        selectedSlideId = slideId
        selectedElementIds = [element.id]
        emit()
    }

    function updateElement(slideId: string, elementId: string, patch: Partial<CarouselElement>) {
        mapSlideElements(slideId, (els) =>
            els.map((e) => (e.id === elementId ? ({ ...e, ...patch } as CarouselElement) : e)),
        )
    }

    function updateSelectedElements(patch: Partial<CarouselElement>) {
        if (!selectedSlideId || selectedElementIds.length === 0) return
        const ids = new Set(selectedElementIds)
        mapSlideElements(selectedSlideId, (els) =>
            els.map((e) => (ids.has(e.id) ? ({ ...e, ...patch } as CarouselElement) : e)),
        )
    }

    function deleteElement(slideId: string, elementId: string) {
        mapSlideElements(slideId, (els) => els.filter((e) => e.id !== elementId))
        selectedElementIds = selectedElementIds.filter((id) => id !== elementId)
        emit()
    }

    function deleteSelectedElements() {
        if (!selectedSlideId || selectedElementIds.length === 0) return
        const ids = new Set(selectedElementIds)
        mapSlideElements(selectedSlideId, (els) => els.filter((e) => !ids.has(e.id)))
        selectedElementIds = []
        emit()
    }

    function duplicateElement(slideId: string, elementId: string) {
        const slide = doc.slides.find((s) => s.id === slideId)
        const source = slide?.elements.find((e) => e.id === elementId)
        if (!source) return
        const copy = duplicateElementOf(source)
        addElement(slideId, copy)
    }

    function reorderElement(slideId: string, elementId: string, direction: 'front' | 'back' | 'forward' | 'backward') {
        const slide = doc.slides.find((s) => s.id === slideId)
        if (!slide) return
        const sorted = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex)
        const idx = sorted.findIndex((e) => e.id === elementId)
        if (idx < 0) return
        let target = idx
        if (direction === 'front') target = sorted.length - 1
        else if (direction === 'back') target = 0
        else if (direction === 'forward') target = Math.min(sorted.length - 1, idx + 1)
        else target = Math.max(0, idx - 1)
        if (target === idx) return
        const [moved] = sorted.splice(idx, 1)
        sorted.splice(target, 0, moved)
        const zById = new Map(sorted.map((e, i) => [e.id, i + 1]))
        mapSlideElements(slideId, (els) => els.map((e) => ({ ...e, zIndex: zById.get(e.id) ?? e.zIndex })))
    }

    // -- store interface -----------------------------------------------------

    return {
        subscribe(listener: () => void) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        getSnapshot(): EditorSnapshot {
            return snapshot
        },
        // selection
        selectSlide,
        selectElements,
        toggleElement,
        clearElementSelection,
        // history
        beginBatch,
        endBatch,
        undo,
        redo,
        // document
        loadDocument,
        setTheme,
        setThemeOverrides,
        setCanvasRatio,
        setBrandChrome,
        // slides
        addSlide,
        insertSlide,
        deleteSlide,
        duplicateSlide,
        moveSlide,
        setSlideRole,
        setSlideBackground,
        // elements
        addElement,
        updateElement,
        updateSelectedElements,
        deleteElement,
        deleteSelectedElements,
        duplicateElement,
        reorderElement,
    }
}
