'use client'

import * as React from 'react'
import { ArrowRightIcon } from 'lucide-react'

import type { GrowthCardData } from '@/config/onboarding-flow'
import { AUDIT_AXES } from '@/config/onboarding-flow'

// ---------------------------------------------------------------------------
// Onboarding chart primitives (design import: onboarding/flow/steps-audit.jsx
// + steps-offer.jsx): the pillar-mix radar for the audit report and the
// animated growth cards for the paywall. Pure SVG, no chart library.
// ---------------------------------------------------------------------------

// ── Radar (your mix vs. ideal mix) ──────────────────────────────────────────

export function Radar({ mine, ideal }: { mine: number[]; ideal: number[] }) {
    const cx = 140
    const cy = 130
    const R = 88
    const angles = [-90, 0, 90, 180]
    const point = (value: number, angle: number): [number, number] => {
        const r = (R * Math.max(3, value)) / 100
        const a = (angle * Math.PI) / 180
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
    }
    const poly = (values: number[]) => values.map((v, i) => point(v, angles[i]).join(',')).join(' ')
    return (
        <>
            <svg viewBox='-60 0 400 248' width='100%' className='mx-auto block max-w-[340px]'>
                {[25, 50, 75, 100].map((p) => (
                    <circle
                        key={p}
                        cx={cx}
                        cy={cy}
                        r={(R * p) / 100}
                        fill='none'
                        stroke='var(--border-strong)'
                        strokeOpacity='0.5'
                    />
                ))}
                {angles.map((a, i) => {
                    const [x, y] = point(100, a)
                    return (
                        <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke='var(--border-strong)' strokeOpacity='0.5' />
                    )
                })}
                {angles.map((a, i) => {
                    const [x, y] = point(128, a)
                    const c = Math.cos((a * Math.PI) / 180)
                    const anchor = Math.abs(c) < 0.3 ? 'middle' : c > 0 ? 'start' : 'end'
                    return (
                        <text
                            key={i}
                            textAnchor={anchor}
                            x={x}
                            y={y + 3}
                            fill='var(--muted-foreground)'
                            fontSize='10.5'
                            fontFamily='var(--font-mono)'>
                            {AUDIT_AXES[i].label}
                        </text>
                    )
                })}
                <polygon
                    points={poly(ideal)}
                    fill='color-mix(in oklch, var(--petrol-500) 12%, transparent)'
                    stroke='var(--petrol-500)'
                    strokeWidth='1.5'
                    strokeDasharray='4 3'
                />
                <polygon
                    points={poly(mine)}
                    fill='color-mix(in oklch, var(--primary) 20%, transparent)'
                    stroke='var(--primary)'
                    strokeWidth='1.75'
                />
            </svg>
            <div className='text-muted-foreground mt-0.5 flex justify-center gap-4 text-[11.5px]'>
                <span className='inline-flex items-center'>
                    <i className='mr-1.5 inline-block size-[9px] rounded-[2px] bg-[var(--primary)]' />
                    Your mix
                </span>
                <span className='inline-flex items-center'>
                    <i className='bg-petrol-500 mr-1.5 inline-block size-[9px] rounded-[2px]' />
                    Ideal mix
                </span>
            </div>
        </>
    )
}

// ── Growth cards (area chart sweeping up to value + count-up) ───────────────

function useCountUp(target: number, fmt: (v: number) => string, duration = 1150, delay = 0): string {
    const [value, setValue] = React.useState(0)
    React.useEffect(() => {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setValue(target)
            return
        }
        let raf: number
        let start: number | undefined
        const run = (t: number) => {
            if (start === undefined) start = t
            const p = Math.min(1, (t - start) / duration)
            const eased = 1 - Math.pow(1 - p, 3)
            setValue(target * eased)
            if (p < 1) raf = requestAnimationFrame(run)
        }
        const timer = setTimeout(() => {
            raf = requestAnimationFrame(run)
        }, delay)
        return () => {
            clearTimeout(timer)
            if (raf) cancelAnimationFrame(raf)
        }
    }, [target, duration, delay])
    return fmt(value)
}

export function smoothPath(pts: [number, number][]): string {
    let d = `M ${pts[0][0]} ${pts[0][1]}`
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] ?? pts[i]
        const p1 = pts[i]
        const p2 = pts[i + 1]
        const p3 = pts[i + 2] ?? p2
        const c1x = p1[0] + (p2[0] - p0[0]) / 6
        const c1y = p1[1] + (p2[1] - p0[1]) / 6
        const c2x = p2[0] - (p3[0] - p1[0]) / 6
        const c2y = p2[1] - (p3[1] - p1[1]) / 6
        d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`
    }
    return d
}

function GrowthChart({ shape, idx }: { shape: number[]; idx: number }) {
    const W = 240
    const H = 72
    const padT = 9
    const padB = 1
    const pts: [number, number][] = shape.map((v, i) => [
        (i / (shape.length - 1)) * W,
        H - padB - v * (H - padT - padB),
    ])
    const line = smoothPath(pts)
    const area = `${line} L ${W} ${H} L 0 ${H} Z`
    const end = pts[pts.length - 1]
    const gid = `obg-grad-${idx}`
    return (
        <svg
            className='animate-ob-gsweep -mx-3.5 mt-2.5 block w-[calc(100%+28px)]'
            viewBox={`0 0 ${W} ${H}`}
            style={{ animationDelay: `${idx * 0.09}s` }}>
            <defs>
                <linearGradient id={gid} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='color-mix(in oklch, var(--green) 30%, transparent)' />
                    <stop offset='100%' stopColor='transparent' />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gid})`} />
            <path
                d={line}
                fill='none'
                stroke='var(--green)'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                vectorEffect='non-scaling-stroke'
            />
            <circle
                className='animate-ob-gdot opacity-0'
                cx={end[0]}
                cy={end[1]}
                r='3.4'
                fill='var(--green)'
                style={{ animationDelay: `${idx * 0.09 + 0.9}s` }}
            />
        </svg>
    )
}

export function GrowthCard({ card, idx }: { card: GrowthCardData; idx: number }) {
    const to = useCountUp(card.toNum, card.fmt, 1150, idx * 90)
    return (
        <div className='bg-secondary border-border relative overflow-hidden rounded-[14px] border px-3.5 pt-3.5'>
            <div className='flex items-start justify-between gap-2'>
                <span className='text-muted-foreground text-[12.5px] leading-[1.3] font-medium'>{card.label}</span>
                <span className='text-success shrink-0 text-[11.5px] font-bold whitespace-nowrap'>{card.pct}</span>
            </div>
            <div className='mt-2 flex items-baseline gap-[7px]'>
                <span className='text-muted-foreground text-[12.5px]'>{card.from}</span>
                <ArrowRightIcon className='text-muted-foreground size-3' />
                <span className='font-heading text-foreground text-2xl leading-none font-bold tabular-nums'>{to}</span>
            </div>
            <GrowthChart shape={card.shape} idx={idx} />
        </div>
    )
}
