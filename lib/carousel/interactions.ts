// ---------------------------------------------------------------------------
// Pointer math for the editor's drag / resize / rotate gestures and alignment
// snapping. All pure, all in canvas-space pixels. Resize is rotation-aware: it
// keeps the handle's opposite anchor fixed while you drag, in the element's
// local frame.
// ---------------------------------------------------------------------------

import { type CarouselElement } from '@/lib/carousel/types'

export type Point = { x: number; y: number }
export type Box = { x: number; y: number; width: number; height: number }

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const MIN_SIZE = 24

export function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v))
}

function toRad(deg: number): number {
    return (deg * Math.PI) / 180
}

/** Rotate a vector by `deg` degrees (clockwise in screen space). */
export function rotateVec(v: Point, deg: number): Point {
    const r = toRad(deg)
    const cos = Math.cos(r)
    const sin = Math.sin(r)
    return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos }
}

function handleDir(handle: ResizeHandle): Point {
    const x = handle.includes('w') ? -1 : handle.includes('e') ? 1 : 0
    const y = handle.includes('n') ? -1 : handle.includes('s') ? 1 : 0
    return { x, y }
}

/**
 * New box for a resize gesture. `pointer` is the live pointer in canvas space;
 * `start` is the element box at gesture start. Keeps the anchor (corner/edge
 * opposite the handle) fixed, accounting for rotation.
 */
export function resizeBox(start: Box, rotation: number, handle: ResizeHandle, pointer: Point, lockAspect = false): Box {
    const dir = handleDir(handle)
    const center = { x: start.x + start.width / 2, y: start.y + start.height / 2 }
    const anchorNorm = { x: -dir.x, y: -dir.y }
    const worldAnchor = {
        x:
            center.x +
            rotateVec({ x: (anchorNorm.x * start.width) / 2, y: (anchorNorm.y * start.height) / 2 }, rotation).x,
        y:
            center.y +
            rotateVec({ x: (anchorNorm.x * start.width) / 2, y: (anchorNorm.y * start.height) / 2 }, rotation).y,
    }
    const local = rotateVec({ x: pointer.x - worldAnchor.x, y: pointer.y - worldAnchor.y }, -rotation)

    let width = dir.x !== 0 ? Math.max(MIN_SIZE, Math.abs(local.x)) : start.width
    let height = dir.y !== 0 ? Math.max(MIN_SIZE, Math.abs(local.y)) : start.height

    if (lockAspect && dir.x !== 0 && dir.y !== 0) {
        const ratio = start.width / start.height
        if (width / height > ratio) width = height * ratio
        else height = width / ratio
    }

    const localCenter = {
        x: dir.x !== 0 ? (Math.sign(local.x) || 1) * (width / 2) : 0,
        y: dir.y !== 0 ? (Math.sign(local.y) || 1) * (height / 2) : 0,
    }
    const worldCenter = {
        x: worldAnchor.x + rotateVec(localCenter, rotation).x,
        y: worldAnchor.y + rotateVec(localCenter, rotation).y,
    }
    return { x: worldCenter.x - width / 2, y: worldCenter.y - height / 2, width, height }
}

/** Rotation (deg) for a rotate gesture, optionally snapped to 15-degree steps. */
export function rotationFromPointer(center: Point, pointer: Point, snap: boolean): number {
    const angle = (Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180) / Math.PI + 90
    const normalized = ((angle % 360) + 360) % 360
    return snap ? Math.round(normalized / 15) * 15 : Math.round(normalized)
}

// -- Snapping ----------------------------------------------------------------

export type SnapGuide = { axis: 'x' | 'y'; pos: number }
export type SnapResult = { x: number; y: number; guides: SnapGuide[] }

function edges(box: Box) {
    return {
        x: [box.x, box.x + box.width / 2, box.x + box.width],
        y: [box.y, box.y + box.height / 2, box.y + box.height],
    }
}

/**
 * Snap a moving box to the slide center lines, the safe margins, and other
 * elements' edges/centers. Returns the adjusted top-left and the guides to draw.
 */
export function snapMove(
    box: Box,
    others: Box[],
    canvas: { width: number; height: number },
    margin: number,
    threshold: number,
): SnapResult {
    const targetsX = [canvas.width / 2, margin, canvas.width - margin]
    const targetsY = [canvas.height / 2, margin, canvas.height - margin]
    for (const o of others) {
        const e = edges(o)
        targetsX.push(...e.x)
        targetsY.push(...e.y)
    }

    const moving = edges(box)
    const guides: SnapGuide[] = []
    let dx = 0
    let dy = 0
    let bestX = threshold + 1
    let bestY = threshold + 1

    for (const mx of moving.x) {
        for (const tx of targetsX) {
            const d = Math.abs(mx - tx)
            if (d < threshold && d < bestX) {
                bestX = d
                dx = tx - mx
                guides.push({ axis: 'x', pos: tx })
            }
        }
    }
    for (const my of moving.y) {
        for (const ty of targetsY) {
            const d = Math.abs(my - ty)
            if (d < threshold && d < bestY) {
                bestY = d
                dy = ty - my
                guides.push({ axis: 'y', pos: ty })
            }
        }
    }

    return {
        x: box.x + (bestX <= threshold ? dx : 0),
        y: box.y + (bestY <= threshold ? dy : 0),
        guides: guides.filter((g) => (g.axis === 'x' ? bestX <= threshold : bestY <= threshold)),
    }
}

export function elementBox(el: CarouselElement): Box {
    return { x: el.x, y: el.y, width: el.width, height: el.height }
}
