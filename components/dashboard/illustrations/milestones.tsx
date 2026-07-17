'use client'

// ---------------------------------------------------------------------------
// Onboarding milestone illustrations — clean, minimal, geometric line-art.
// Two-color only: `currentColor` for line work (set via a text-* class on the
// caller) and `--primary` for the single accent. They theme automatically for
// light/dark and any future rebrand. Ambient motion is subtle and loops gently;
// reduced motion is handled globally by the onboarding's <MotionConfig>.
// ---------------------------------------------------------------------------
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

type IllustrationProps = {
    className?: string
}

/** Welcome: a profile card with an orbiting accent — "let's set you up". */
export function WelcomeMark({ className }: IllustrationProps) {
    return (
        <svg viewBox='0 0 200 160' fill='none' className={cn('text-muted-foreground/70', className)} aria-hidden='true'>
            {/* soft card */}
            <motion.rect
                x='44'
                y='34'
                width='112'
                height='92'
                rx='14'
                stroke='currentColor'
                strokeWidth='2'
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* avatar */}
            <circle cx='72' cy='66' r='13' className='fill-primary/10 stroke-primary' strokeWidth='2' />
            {/* headline + line */}
            <rect x='94' y='59' width='44' height='6' rx='3' fill='currentColor' opacity='0.5' />
            <rect x='94' y='71' width='30' height='6' rx='3' fill='currentColor' opacity='0.3' />
            {/* body lines */}
            <rect x='62' y='96' width='76' height='6' rx='3' fill='currentColor' opacity='0.25' />
            <rect x='62' y='108' width='52' height='6' rx='3' fill='currentColor' opacity='0.2' />
            {/* orbiting accent */}
            <motion.g
                style={{ originX: '100px', originY: '80px' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
                <circle cx='154' cy='40' r='5' className='fill-primary' />
            </motion.g>
            <motion.circle
                cx='40'
                cy='110'
                r='3.5'
                className='fill-primary'
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            />
        </svg>
    )
}

/** Building: nodes connecting into a structure — "assembling your setup". */
export function BuildingSetup({ className }: IllustrationProps) {
    const nodes = [
        { cx: 56, cy: 54 },
        { cx: 142, cy: 48 },
        { cx: 100, cy: 86 },
        { cx: 54, cy: 116 },
        { cx: 148, cy: 112 },
    ]
    const edges = [
        [0, 2],
        [1, 2],
        [2, 3],
        [2, 4],
        [0, 3],
        [1, 4],
    ] as const

    return (
        <svg viewBox='0 0 200 160' fill='none' className={cn('text-muted-foreground/60', className)} aria-hidden='true'>
            {edges.map(([a, b], i) => (
                <motion.line
                    key={i}
                    x1={nodes[a].cx}
                    y1={nodes[a].cy}
                    x2={nodes[b].cx}
                    y2={nodes[b].cy}
                    stroke='currentColor'
                    strokeWidth='2'
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.7 }}
                    transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                />
            ))}
            {nodes.map((n, i) => (
                <motion.circle
                    key={i}
                    cx={n.cx}
                    cy={n.cy}
                    r={i === 2 ? 9 : 6}
                    className={i === 2 ? 'fill-primary' : 'fill-primary/15 stroke-primary'}
                    strokeWidth='2'
                    animate={{ scale: [1, 1.18, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
                    style={{ originX: `${n.cx}px`, originY: `${n.cy}px` }}
                />
            ))}
        </svg>
    )
}

/** Complete: a check inside a ring, with geometric confetti — "you're all set". */
export function SetupComplete({ className }: IllustrationProps) {
    const sparks = [
        { x: 40, y: 36, r: 3 },
        { x: 162, y: 44, r: 4 },
        { x: 150, y: 120, r: 3 },
        { x: 46, y: 116, r: 4 },
        { x: 100, y: 22, r: 3 },
    ]
    return (
        <svg viewBox='0 0 200 160' fill='none' className={cn('text-muted-foreground/60', className)} aria-hidden='true'>
            <motion.circle
                cx='100'
                cy='80'
                r='38'
                className='fill-primary/10 stroke-primary'
                strokeWidth='2.5'
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{ originX: '100px', originY: '80px' }}
            />
            <motion.path
                d='M82 80 l12 12 l24 -26'
                className='stroke-primary'
                strokeWidth='4'
                strokeLinecap='round'
                strokeLinejoin='round'
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
            {sparks.map((s, i) => (
                <motion.circle
                    key={i}
                    cx={s.x}
                    cy={s.y}
                    r={s.r}
                    className={i % 2 === 0 ? 'fill-primary' : 'fill-current opacity-40'}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.9] }}
                    transition={{ duration: 0.6, delay: 0.7 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    style={{ originX: `${s.x}px`, originY: `${s.y}px` }}
                />
            ))}
        </svg>
    )
}
