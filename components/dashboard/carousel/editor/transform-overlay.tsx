'use client'

// ---------------------------------------------------------------------------
// Selection chrome for the active element: a bounding outline, eight resize
// handles, and a rotate knob. Sizes counter-scale by the canvas display scale
// so handles stay a constant on-screen size at any zoom. Lives inside the
// scaled canvas coordinate space, so positions are plain canvas pixels.
// ---------------------------------------------------------------------------
import * as React from 'react'

import { type Box, type ResizeHandle } from '@/lib/carousel/interactions'

const HANDLES: { id: ResizeHandle; cx: number; cy: number; cursor: string }[] = [
    { id: 'nw', cx: 0, cy: 0, cursor: 'nwse-resize' },
    { id: 'n', cx: 0.5, cy: 0, cursor: 'ns-resize' },
    { id: 'ne', cx: 1, cy: 0, cursor: 'nesw-resize' },
    { id: 'e', cx: 1, cy: 0.5, cursor: 'ew-resize' },
    { id: 'se', cx: 1, cy: 1, cursor: 'nwse-resize' },
    { id: 's', cx: 0.5, cy: 1, cursor: 'ns-resize' },
    { id: 'sw', cx: 0, cy: 1, cursor: 'nesw-resize' },
    { id: 'w', cx: 0, cy: 0.5, cursor: 'ew-resize' },
]

const ACCENT = '#2D7FF9'

type Props = {
    box: Box
    rotation: number
    scale: number
    resizable: boolean
    onResizeStart: (handle: ResizeHandle, e: React.PointerEvent) => void
    onRotateStart: (e: React.PointerEvent) => void
}

export function TransformOverlay({ box, rotation, scale, resizable, onResizeStart, onRotateStart }: Props) {
    const h = 11 / scale
    const border = 1.5 / scale
    const rotateGap = 30 / scale

    return (
        <div
            style={{
                position: 'absolute',
                left: box.x,
                top: box.y,
                width: box.width,
                height: box.height,
                transform: rotation ? `rotate(${rotation}deg)` : 'none',
                transformOrigin: 'center',
                pointerEvents: 'none',
            }}>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    border: `${border}px solid ${ACCENT}`,
                    borderRadius: 1 / scale,
                }}
            />

            {/* Rotate knob */}
            <div
                onPointerDown={onRotateStart}
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: -rotateGap,
                    width: h,
                    height: h,
                    marginLeft: -h / 2,
                    borderRadius: '50%',
                    background: '#fff',
                    border: `${border}px solid ${ACCENT}`,
                    pointerEvents: 'auto',
                    cursor: 'grab',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: -rotateGap + h / 2,
                    width: border,
                    height: rotateGap - h / 2,
                    marginLeft: -border / 2,
                    background: ACCENT,
                    pointerEvents: 'none',
                }}
            />

            {resizable
                ? HANDLES.map((handle) => (
                      <div
                          key={handle.id}
                          onPointerDown={(e) => onResizeStart(handle.id, e)}
                          style={{
                              position: 'absolute',
                              left: `${handle.cx * 100}%`,
                              top: `${handle.cy * 100}%`,
                              width: h,
                              height: h,
                              marginLeft: -h / 2,
                              marginTop: -h / 2,
                              background: '#fff',
                              border: `${border}px solid ${ACCENT}`,
                              borderRadius: 2 / scale,
                              pointerEvents: 'auto',
                              cursor: handle.cursor,
                          }}
                      />
                  ))
                : null}
        </div>
    )
}
