'use client'

import * as React from 'react'

// ---------------------------------------------------------------------------
// useScrollGate - tracks how far the user has scrolled the modal's scroll
// container, from an anchor element rendered inside it. `atEnd` flips once the
// bottom is reached (React state - it changes rarely). Progress is delivered
// through the `onProgress` callback on every scroll frame and is deliberately
// NOT React state: the consumer applies it imperatively so a per-frame scroll
// indicator never re-renders the surrounding page. When the content isn't tall
// enough to scroll, it reports done immediately so a scroll-gated CTA never
// traps the user on a short screen.
// ---------------------------------------------------------------------------

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
    let node = el?.parentElement ?? null
    while (node) {
        const overflowY = getComputedStyle(node).overflowY
        if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return node
        node = node.parentElement
    }
    return null
}

type ScrollGateOptions = {
    endThreshold?: number
    /** Fired with 0..1 progress on every scroll frame. Keep the handler imperative
     *  (write to a DOM node) so the indicator updates without a React re-render. */
    onProgress?: (progress: number) => void
}

export function useScrollGate(
    anchorRef: React.RefObject<HTMLElement | null>,
    { endThreshold = 24, onProgress }: ScrollGateOptions = {},
) {
    const [atEnd, setAtEnd] = React.useState(false)
    const onProgressRef = React.useRef(onProgress)
    React.useEffect(() => {
        onProgressRef.current = onProgress
    })

    React.useEffect(() => {
        const anchor = anchorRef.current
        const scroller = findScrollParent(anchor)
        if (!scroller) {
            // No scroll container (or nothing scrolls): everything is visible.
            onProgressRef.current?.(1)
            setAtEnd(true)
            return
        }

        let raf = 0
        const measure = () => {
            raf = 0
            const max = scroller.scrollHeight - scroller.clientHeight
            if (max <= endThreshold) {
                // Content fits without a meaningful scroll - don't gate the CTA.
                onProgressRef.current?.(1)
                setAtEnd(true)
                return
            }
            const progress = Math.min(1, Math.max(0, scroller.scrollTop / max))
            onProgressRef.current?.(progress)
            // React bails out when the boolean is unchanged, so mid-scroll frames
            // cost nothing - only the flip at the bottom triggers a re-render.
            setAtEnd(scroller.scrollTop >= max - endThreshold)
        }

        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(measure)
        }

        measure()
        scroller.addEventListener('scroll', onScroll, { passive: true })
        // Re-measure as the viewport or the content height changes (late-loading
        // sections, images, the reveal animations settling).
        const ro = new ResizeObserver(measure)
        ro.observe(scroller)
        if (anchor) ro.observe(anchor)

        return () => {
            scroller.removeEventListener('scroll', onScroll)
            ro.disconnect()
            if (raf) cancelAnimationFrame(raf)
        }
    }, [anchorRef, endThreshold])

    return { atEnd }
}
