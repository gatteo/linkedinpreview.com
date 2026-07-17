'use client'

// ---------------------------------------------------------------------------
// A tiny, on-brand confetti burst built with Framer Motion — no new dependency.
// Geometric shapes (squares, circles, bars) in the primary accent + muted tones,
// fired once from center. Honors reduced motion (renders nothing).
// ---------------------------------------------------------------------------
import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

function buildPieces(count: number) {
    return Array.from({ length: count }, (_, i) => {
        // Deterministic pseudo-random so SSR/CSR match and we avoid Math.random.
        const a = (i * 9301 + 49297) % 233280
        const r = a / 233280
        const angle = (i / count) * Math.PI * 2 + r
        const distance = 120 + r * 160
        return {
            id: i,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance - 40,
            rotate: r * 540 - 270,
            delay: r * 0.12,
            shape: i % 3,
            accent: i % 2 === 0,
            size: 7 + Math.round(r * 6),
        }
    })
}

export function Confetti({ count = 26 }: { count?: number }) {
    const reduce = useReducedMotion()
    const pieces = React.useMemo(() => buildPieces(count), [count])
    if (reduce) return null

    return (
        <div className='pointer-events-none absolute inset-0 z-50 overflow-hidden' aria-hidden='true'>
            <div className='absolute top-1/2 left-1/2'>
                {pieces.map((p) => (
                    <motion.span
                        key={p.id}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
                        animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
                        transition={{ duration: 1.1, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
                        className={p.accent ? 'bg-primary absolute' : 'bg-muted-foreground/50 absolute'}
                        style={{
                            width: p.shape === 2 ? p.size * 2 : p.size,
                            height: p.shape === 2 ? p.size / 2 : p.size,
                            borderRadius: p.shape === 1 ? '9999px' : '2px',
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
