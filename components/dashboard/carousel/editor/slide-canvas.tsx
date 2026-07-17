'use client'

// ---------------------------------------------------------------------------
// The interactive editing surface. Renders the active slide's SlideArtboard
// (the same presentational unit used for export) scaled to fit, with an
// interaction overlay on top: per-element hit targets for select/drag, the
// transform overlay for the selected element, snap guides, and in-place text
// editing. All gesture math is in canvas-space pixels; the display scale only
// affects rendering, never the stored geometry.
// ---------------------------------------------------------------------------
import * as React from 'react'

import {
    elementBox,
    resizeBox,
    rotationFromPointer,
    snapMove,
    type Point,
    type ResizeHandle,
    type SnapGuide,
} from '@/lib/carousel/interactions'
import { resolveTheme } from '@/lib/carousel/theme'
import { SAFE_MARGIN } from '@/lib/carousel/types'
import { cn } from '@/lib/utils'

import { SlideArtboard } from '../render/slide-artboard'
import { shallowArrayEqual, useCarousel, useStoreApi } from '../use-carousel-store'
import { EditableText } from './editable-text'
import { TransformOverlay } from './transform-overlay'

const CANVAS_PAD = 48

export function SlideCanvas() {
    const store = useStoreApi()
    const doc = useCarousel((s) => s.doc)
    const selectedSlideId = useCarousel((s) => s.selectedSlideId)
    const selectedIds = useCarousel((s) => s.selectedElementIds, shallowArrayEqual)

    const slideIndex = Math.max(
        0,
        doc.slides.findIndex((s) => s.id === selectedSlideId),
    )
    const slide = doc.slides[slideIndex] ?? doc.slides[0]
    const slideId = slide?.id ?? null
    const theme = React.useMemo(() => resolveTheme(doc.themeId, doc.themeOverrides), [doc.themeId, doc.themeOverrides])

    const containerRef = React.useRef<HTMLDivElement>(null)
    const artboardRef = React.useRef<HTMLDivElement>(null)
    const [scale, setScale] = React.useState(0.3)
    const scaleRef = React.useRef(scale)
    React.useEffect(() => {
        scaleRef.current = scale
    }, [scale])
    const [guides, setGuides] = React.useState<SnapGuide[]>([])
    const [editingId, setEditingId] = React.useState<string | null>(null)

    const { width: canvasW, height: canvasH } = doc.canvas

    // Fit the artboard to the available area.
    React.useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const measure = () => {
            const w = el.clientWidth - CANVAS_PAD * 2
            const h = el.clientHeight - CANVAS_PAD * 2
            if (w <= 0 || h <= 0) return
            setScale(Math.max(0.05, Math.min(w / canvasW, h / canvasH, 1)))
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [canvasW, canvasH])

    React.useEffect(() => setEditingId(null), [selectedSlideId])
    React.useEffect(() => {
        if (editingId && !selectedIds.includes(editingId)) setEditingId(null)
    }, [editingId, selectedIds])

    const toCanvas = React.useCallback((e: { clientX: number; clientY: number }): Point => {
        const rect = artboardRef.current?.getBoundingClientRect()
        if (!rect) return { x: 0, y: 0 }
        return { x: (e.clientX - rect.left) / scaleRef.current, y: (e.clientY - rect.top) / scaleRef.current }
    }, [])

    // -- gestures ------------------------------------------------------------

    const beginMove = (elId: string, e: React.PointerEvent) => {
        if (e.button !== 0 || !slideId) return
        const additive = e.shiftKey || e.metaKey || e.ctrlKey
        const current = store.getSnapshot().selectedElementIds
        let movingIds: string[]
        if (additive) {
            store.toggleElement(elId, true)
            movingIds = store.getSnapshot().selectedElementIds
        } else if (current.includes(elId)) {
            movingIds = current
        } else {
            store.toggleElement(elId, false)
            movingIds = [elId]
        }
        const slideNow = store.getSnapshot().doc.slides[slideIndex]
        const startBoxes = new Map(movingIds.map((id) => [id, elementBox(slideNow.elements.find((x) => x.id === id)!)]))
        const others = slideNow.elements.filter((x) => !movingIds.includes(x.id)).map(elementBox)
        const startPointer = toCanvas(e)
        const primary = movingIds[0]
        const primaryStart = startBoxes.get(primary)!

        store.beginBatch()
        const onMove = (ev: PointerEvent) => {
            const p = toCanvas(ev)
            const dx = p.x - startPointer.x
            const dy = p.y - startPointer.y
            const snapInput = { ...primaryStart, x: primaryStart.x + dx, y: primaryStart.y + dy }
            const res = snapMove(snapInput, others, doc.canvas, SAFE_MARGIN, 6 / scaleRef.current)
            const adjDx = res.x - primaryStart.x
            const adjDy = res.y - primaryStart.y
            setGuides(res.guides)
            for (const id of movingIds) {
                const b = startBoxes.get(id)!
                store.updateElement(slideId, id, { x: Math.round(b.x + adjDx), y: Math.round(b.y + adjDy) })
            }
        }
        const onUp = () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            store.endBatch()
            setGuides([])
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
    }

    const beginResize = (handle: ResizeHandle, e: React.PointerEvent) => {
        e.stopPropagation()
        if (e.button !== 0 || !slideId) return
        const id = store.getSnapshot().selectedElementIds[0]
        if (!id) return
        const el = store.getSnapshot().doc.slides[slideIndex].elements.find((x) => x.id === id)!
        const startBox = elementBox(el)
        const rotation = el.rotation
        const isImage = el.type === 'image'

        store.beginBatch()
        const onMove = (ev: PointerEvent) => {
            const box = resizeBox(startBox, rotation, handle, toCanvas(ev), ev.shiftKey || isImage)
            store.updateElement(slideId, id, {
                x: Math.round(box.x),
                y: Math.round(box.y),
                width: Math.round(box.width),
                height: Math.round(box.height),
            })
        }
        const onUp = () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            store.endBatch()
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
    }

    const beginRotate = (e: React.PointerEvent) => {
        e.stopPropagation()
        if (e.button !== 0 || !slideId) return
        const id = store.getSnapshot().selectedElementIds[0]
        if (!id) return
        const el = store.getSnapshot().doc.slides[slideIndex].elements.find((x) => x.id === id)!
        const center = { x: el.x + el.width / 2, y: el.y + el.height / 2 }

        store.beginBatch()
        const onMove = (ev: PointerEvent) => {
            store.updateElement(slideId, id, { rotation: rotationFromPointer(center, toCanvas(ev), ev.shiftKey) })
        }
        const onUp = () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            store.endBatch()
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
    }

    // -- keyboard ------------------------------------------------------------

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null
            if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
            const meta = e.metaKey || e.ctrlKey
            const key = e.key.toLowerCase()
            if (meta && key === 'z') {
                e.preventDefault()
                if (e.shiftKey) store.redo()
                else store.undo()
                return
            }
            if (meta && key === 'd') {
                e.preventDefault()
                const snap = store.getSnapshot()
                snap.selectedElementIds.forEach(
                    (id) => snap.selectedSlideId && store.duplicateElement(snap.selectedSlideId, id),
                )
                return
            }
            const snap = store.getSnapshot()
            const sid = snap.selectedSlideId
            if (!sid || snap.selectedElementIds.length === 0) return
            if (key === 'delete' || key === 'backspace') {
                e.preventDefault()
                store.deleteSelectedElements()
                return
            }
            const arrows: Record<string, [number, number]> = {
                arrowleft: [-1, 0],
                arrowright: [1, 0],
                arrowup: [0, -1],
                arrowdown: [0, 1],
            }
            if (arrows[key]) {
                e.preventDefault()
                const step = e.shiftKey ? 10 : 1
                const [dx, dy] = arrows[key]
                const slideNow = snap.doc.slides.find((s) => s.id === sid)
                if (!slideNow) return
                store.beginBatch()
                snap.selectedElementIds.forEach((id) => {
                    const el = slideNow.elements.find((x) => x.id === id)
                    if (el) store.updateElement(sid, id, { x: el.x + dx * step, y: el.y + dy * step })
                })
                store.endBatch()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [store])

    if (!slide) return null

    const sortedElements = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex)
    const singleSelected =
        selectedIds.length === 1 ? (slide.elements.find((el) => el.id === selectedIds[0]) ?? null) : null
    const editingEl = editingId ? slide.elements.find((el) => el.id === editingId) : null

    return (
        <div
            ref={containerRef}
            className='bg-muted/40 relative flex flex-1 items-center justify-center overflow-hidden'
            style={{ padding: CANVAS_PAD }}>
            <div style={{ width: canvasW * scale, height: canvasH * scale, flexShrink: 0 }}>
                <div
                    ref={artboardRef}
                    className='relative origin-top-left shadow-2xl'
                    style={{ width: canvasW, height: canvasH, transform: `scale(${scale})` }}>
                    <SlideArtboard slide={slide} doc={doc} theme={theme} index={slideIndex} total={doc.slides.length} />

                    {/* Interaction overlay */}
                    <div className='absolute inset-0'>
                        {/* Deselect catcher (behind hit targets) */}
                        <div
                            className='absolute inset-0'
                            style={{ zIndex: 0 }}
                            onPointerDown={() => {
                                store.clearElementSelection()
                                setEditingId(null)
                            }}
                        />

                        {sortedElements.map((el) => {
                            if (editingId === el.id && el.type === 'text') return null
                            const selected = selectedIds.includes(el.id)
                            return (
                                <div
                                    key={el.id}
                                    onPointerDown={(e) => !el.locked && beginMove(el.id, e)}
                                    onDoubleClick={() => {
                                        if (el.type === 'text' && !el.locked) {
                                            store.toggleElement(el.id, false)
                                            setEditingId(el.id)
                                        }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        left: el.x,
                                        top: el.y,
                                        width: el.width,
                                        height: el.height,
                                        transform: el.rotation ? `rotate(${el.rotation}deg)` : 'none',
                                        transformOrigin: 'center',
                                        zIndex: el.zIndex,
                                        cursor: el.locked ? 'default' : 'move',
                                        outline: selected && !singleSelected ? '2px solid #2D7FF9' : 'none',
                                        outlineOffset: 0,
                                    }}
                                />
                            )
                        })}

                        {editingEl && editingEl.type === 'text' && slideId ? (
                            <EditableText
                                slideId={slideId}
                                el={editingEl}
                                theme={theme}
                                onExit={() => setEditingId(null)}
                            />
                        ) : null}

                        {singleSelected && !editingId ? (
                            <TransformOverlay
                                box={elementBox(singleSelected)}
                                rotation={singleSelected.rotation}
                                scale={scale}
                                resizable={!singleSelected.locked}
                                onResizeStart={beginResize}
                                onRotateStart={beginRotate}
                            />
                        ) : null}

                        {/* Snap guides */}
                        {guides.map((g, i) =>
                            g.axis === 'x' ? (
                                <div
                                    key={`gx-${i}`}
                                    className='pointer-events-none absolute bg-[#2D7FF9]'
                                    style={{ left: g.pos, top: 0, width: 1 / scale, height: canvasH }}
                                />
                            ) : (
                                <div
                                    key={`gy-${i}`}
                                    className='pointer-events-none absolute bg-[#2D7FF9]'
                                    style={{ top: g.pos, left: 0, height: 1 / scale, width: canvasW }}
                                />
                            ),
                        )}
                    </div>
                </div>
            </div>

            {/* Slide position chip */}
            <div
                className={cn(
                    'bg-background/90 text-muted-foreground absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1 text-xs font-medium shadow-sm',
                )}>
                Slide {slideIndex + 1} of {doc.slides.length} - {Math.round(scale * 100)}%
            </div>
        </div>
    )
}
