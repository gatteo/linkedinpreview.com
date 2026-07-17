'use client'

import * as React from 'react'

import { CTA } from './primitives'

// ---------------------------------------------------------------------------
// ScrollProgressButton - a CTA that stays disabled until the reader reaches the
// end of a scroll container, with its border tracing scroll depth. Progress is
// written to the rect imperatively by the caller (rectRef + useScrollGate's
// onProgress), so the indicator updates per-frame without re-rendering the page.
// ---------------------------------------------------------------------------

export function ScrollProgressButton({
    atEnd,
    rectRef,
    onClick,
    children,
}: {
    atEnd: boolean
    rectRef: React.RefObject<SVGRectElement | null>
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
            <CTA disabled={!atEnd} onClick={onClick}>
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
