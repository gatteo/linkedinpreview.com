'use client'

import * as React from 'react'
import { animate, useInView } from 'framer-motion'

type AnimatedNumberProps = {
    value: number
    format: (n: number) => string
    durationMs?: number
}

/** Counts up to `value` once it scrolls into view, formatting each frame. */
export function AnimatedNumber({ value, format, durationMs = 900 }: AnimatedNumberProps) {
    const ref = React.useRef<HTMLSpanElement>(null)
    const inView = useInView(ref, { once: true, margin: '-40px' })
    const [display, setDisplay] = React.useState(0)

    React.useEffect(() => {
        if (!inView) return
        const controls = animate(0, value, {
            duration: durationMs / 1000,
            ease: 'easeOut',
            onUpdate: (v) => setDisplay(v),
        })
        return () => controls.stop()
    }, [inView, value, durationMs])

    return (
        <span ref={ref} className='tabular-nums'>
            {format(inView ? display : 0)}
        </span>
    )
}
