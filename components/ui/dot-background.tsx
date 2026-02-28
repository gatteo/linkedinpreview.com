'use client'

import { useCallback, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

interface DotBackgroundProps {
    className?: string
    children?: React.ReactNode
    /** Gap between dots in px */
    gap?: number
    /** Dot radius in px */
    radius?: number
    /** Base dot color (rgba recommended) */
    color?: string
    /** Glow color for bright dots */
    glowColor?: string
    /** Min animation speed rad/s */
    speedMin?: number
    /** Max animation speed rad/s */
    speedMax?: number
}

interface Dot {
    x: number
    y: number
    phase: number
    speed: number
}

export function DotBackground({
    className,
    children,
    gap = 24,
    radius = 1,
    color = 'rgba(0, 0, 0, 0.1)',
    glowColor = 'rgba(0, 119, 181, 0.8)',
    speedMin = 0.3,
    speedMax = 1.2,
}: DotBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const dotsRef = useRef<Dot[]>([])
    const rafRef = useRef<number>(0)
    const sizeRef = useRef({ w: 0, h: 0 })

    const initDots = useCallback(
        (w: number, h: number) => {
            const dots: Dot[] = []
            const cols = Math.ceil(w / gap) + 1
            const rows = Math.ceil(h / gap) + 1
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    dots.push({
                        x: col * gap,
                        y: row * gap,
                        phase: Math.random() * Math.PI * 2,
                        speed: speedMin + Math.random() * (speedMax - speedMin),
                    })
                }
            }
            return dots
        },
        [gap, speedMin, speedMax],
    )

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            const rect = canvas.parentElement!.getBoundingClientRect()
            const w = rect.width
            const h = rect.height
            canvas.width = w * dpr
            canvas.height = h * dpr
            canvas.style.width = `${w}px`
            canvas.style.height = `${h}px`
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            sizeRef.current = { w, h }
            dotsRef.current = initDots(w, h)
        }

        resize()

        const ro = new ResizeObserver(resize)
        ro.observe(canvas.parentElement!)

        // Respect prefers-reduced-motion
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        let lastTime = performance.now()

        const draw = (time: number) => {
            const dt = (time - lastTime) / 1000
            lastTime = time

            const { w, h } = sizeRef.current
            ctx.clearRect(0, 0, w, h)

            // Center of the radial fade
            const cx = w / 2
            const cy = h * 0.4
            const maxDist = Math.sqrt(cx * cx + cy * cy)

            for (const dot of dotsRef.current) {
                if (!prefersReduced) dot.phase += dot.speed * dt

                // Sine wave opacity per dot (0.15 to 1)
                const wave = prefersReduced ? 0.5 : 0.15 + 0.85 * ((Math.sin(dot.phase) + 1) / 2)

                // Radial fade: dots near edges are fully visible, center fades out
                const dx = dot.x - cx
                const dy = dot.y - cy
                const dist = Math.sqrt(dx * dx + dy * dy)
                const normalizedDist = dist / maxDist
                // Fade: transparent at center, opaque at edges
                const radialFade = Math.min(1, Math.max(0, (normalizedDist - 0.1) / 0.5))

                const alpha = wave * radialFade

                if (alpha < 0.01) continue

                // Glow for bright dots
                if (alpha > 0.6) {
                    ctx.beginPath()
                    ctx.arc(dot.x, dot.y, radius + 2, 0, Math.PI * 2)
                    ctx.globalAlpha = (alpha - 0.5) * 0.5
                    ctx.fillStyle = glowColor
                    ctx.fill()
                }

                ctx.beginPath()
                ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2)
                ctx.globalAlpha = alpha * 0.5
                ctx.fillStyle = color
                ctx.fill()
            }

            ctx.globalAlpha = 1

            // Only loop if motion is allowed
            if (!prefersReduced) {
                rafRef.current = requestAnimationFrame(draw)
            }
        }

        // Draw once for reduced motion, loop otherwise
        if (prefersReduced) {
            draw(performance.now())
        } else {
            rafRef.current = requestAnimationFrame(draw)
        }

        return () => {
            cancelAnimationFrame(rafRef.current)
            ro.disconnect()
        }
    }, [initDots, radius, color, glowColor])

    return (
        <div className={cn('relative', className)}>
            <canvas ref={canvasRef} className='pointer-events-none absolute inset-0' aria-hidden='true' />
            <div className='relative'>{children}</div>
        </div>
    )
}
