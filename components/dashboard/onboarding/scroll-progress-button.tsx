'use client'

import * as React from 'react'

import { track } from './ai'
import { CTA } from './primitives'
import { findScrollParent } from './use-scroll-gate'

// ---------------------------------------------------------------------------
// ScrollProgressButton - a CTA whose border traces scroll depth through the
// offer. Progress is written to the rect imperatively by the caller (rectRef +
// useScrollGate's onProgress), so the indicator updates per-frame without
// re-rendering the page.
//
// The button used to be `disabled` until the reader hit the end. That dead-ended
// a third of paywall traffic: a disabled button swallows the click, so the user
// got no feedback AND the attempt was invisible to analytics. It stays clickable
// now - clicking before the end carries the reader to the offer instead of doing
// nothing, and the attempt is tracked so the gate's cost stays measurable.
// ---------------------------------------------------------------------------

export function ScrollProgressButton({
    atEnd,
    rectRef,
    step,
    onClick,
    children,
}: {
    atEnd: boolean
    rectRef: React.RefObject<SVGRectElement | null>
    /** Which gated screen this button sits on. Stamped on the blocked event:
     *  the button is shared, and without it reveal-gate clicks are
     *  indistinguishable from blocked purchase intent on the paywall. */
    step: 'reveal' | 'paywall'
    onClick: () => void
    children: React.ReactNode
}) {
    const wrapRef = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({ w: 0, h: 0 })

    React.useEffect(() => {
        const el = wrapRef.current
        if (!el) return
        const sync = () => setSize({ w: el.offsetWidth, h: el.offsetHeight })
        sync()
        const ro = new ResizeObserver(sync)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const stroke = 2
    const radius = 12 // matches the CTA's rounded-xl
    return (
        <div ref={wrapRef} className='relative w-full'>
            <CTA
                onClick={() => {
                    if (atEnd) {
                        onClick()
                        return
                    }
                    // Not read yet: take them to the offer rather than swallowing
                    // the click, and record that the gate blocked a purchase intent.
                    track('onb_paywall_gate_blocked', { step })
                    const scroller = findScrollParent(wrapRef.current)
                    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
                }}>
                {children}
            </CTA>
            {!atEnd && size.w > 0 && (
                <svg aria-hidden width={size.w} height={size.h} className='pointer-events-none absolute inset-0'>
                    <rect
                        ref={rectRef}
                        x={stroke / 2}
                        y={stroke / 2}
                        width={size.w - stroke}
                        height={size.h - stroke}
                        rx={radius}
                        ry={radius}
                        fill='none'
                        stroke='var(--primary)'
                        strokeWidth={stroke}
                        strokeLinecap='round'
                        pathLength={1}
                        strokeDasharray='1 1'
                        strokeDashoffset={1}
                    />
                </svg>
            )}
        </div>
    )
}
