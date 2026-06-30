'use client'

// ---------------------------------------------------------------------------
// Presentational element views shared by the live editor (when an element is
// not being edited) and the export pipeline. They are pure and non-interactive
// - selection/drag/resize live in a separate overlay so that what you see here
// is exactly what gets rasterized. Inline styles are the documented
// slide-renderer exception (canvas geometry + resolved theme colors).
// ---------------------------------------------------------------------------
import * as React from 'react'

import { CAROUSEL_ICONS } from '@/lib/carousel/icons'
import { resolveColor, type ResolvedTheme } from '@/lib/carousel/theme'
import {
    MIN_BODY_FONT,
    type IconElement,
    type ImageElement,
    type ShapeElement,
    type TextElement,
} from '@/lib/carousel/types'

import { renderTiptap } from './tiptap-content'

function baseTransform(rotation: number): string {
    return rotation ? `rotate(${rotation}deg)` : 'none'
}

/** Shrink the displayed font size until the text fits its box (autoFit). */
function useShrinkToFit(deps: unknown[], baseSize: number, enabled: boolean) {
    const ref = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState(baseSize)
    React.useLayoutEffect(() => {
        const node = ref.current
        if (!node) return
        if (!enabled) {
            setSize(baseSize)
            return
        }
        const min = Math.max(12, MIN_BODY_FONT - 6)
        let current = baseSize
        node.style.fontSize = `${current}px`
        // Shrink in 2px steps while the content overflows its fixed-height box.
        while (current > min && node.scrollHeight > node.clientHeight + 1) {
            current -= 2
            node.style.fontSize = `${current}px`
        }
        setSize(current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, baseSize, enabled])
    return { ref, size }
}

export function TextElementView({ el, theme }: { el: TextElement; theme: ResolvedTheme }) {
    const color = resolveColor(theme, el.colorToken, el.color)
    const justify = el.valign === 'top' ? 'flex-start' : el.valign === 'bottom' ? 'flex-end' : 'center'
    const { ref, size } = useShrinkToFit(
        [el.text, el.width, el.height, el.lineHeight],
        el.fontSize,
        el.autoFit === 'shrink',
    )
    return (
        <div
            ref={ref}
            style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                transform: baseTransform(el.rotation),
                opacity: el.opacity,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: justify,
                overflow: 'hidden',
                fontFamily: theme.fonts[el.fontToken],
                fontSize: size,
                fontWeight: el.fontWeight,
                lineHeight: el.lineHeight,
                letterSpacing: el.letterSpacing,
                textAlign: el.align,
                color,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
            }}>
            {renderTiptap(el.html, el.fontWeight)}
        </div>
    )
}

export function ImageElementView({ el }: { el: ImageElement }) {
    return (
        <div
            style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                transform: baseTransform(el.rotation),
                opacity: el.opacity,
                borderRadius: el.radius,
                overflow: 'hidden',
                background: el.src ? undefined : 'rgba(127,127,127,0.12)',
            }}>
            {el.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={el.src}
                    alt={el.alt}
                    crossOrigin='anonymous'
                    style={{ width: '100%', height: '100%', objectFit: el.fit, display: 'block' }}
                />
            ) : null}
        </div>
    )
}

export function ShapeElementView({ el, theme }: { el: ShapeElement; theme: ResolvedTheme }) {
    const fill = resolveColor(theme, el.fillToken, el.fill)
    const common: React.CSSProperties = {
        position: 'absolute',
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        transform: baseTransform(el.rotation),
        opacity: el.opacity,
    }
    if (el.shape === 'ellipse') {
        return (
            <div
                style={{
                    ...common,
                    background: fill,
                    borderRadius: '50%',
                    border: el.stroke ? `${el.strokeWidth}px solid ${el.stroke}` : undefined,
                }}
            />
        )
    }
    if (el.shape === 'line') {
        return <div style={{ ...common, background: fill, borderRadius: 999 }} />
    }
    return (
        <div
            style={{
                ...common,
                background: fill,
                borderRadius: el.radius,
                border: el.stroke ? `${el.strokeWidth}px solid ${el.stroke}` : undefined,
            }}
        />
    )
}

export function IconElementView({ el, theme }: { el: IconElement; theme: ResolvedTheme }) {
    const Icon = CAROUSEL_ICONS[el.name] ?? CAROUSEL_ICONS.sparkles
    const color = resolveColor(theme, el.colorToken, el.color)
    return (
        <div
            style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                transform: baseTransform(el.rotation),
                opacity: el.opacity,
                color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
            <Icon style={{ width: '100%', height: '100%' }} strokeWidth={el.strokeWidth} absoluteStrokeWidth />
        </div>
    )
}
