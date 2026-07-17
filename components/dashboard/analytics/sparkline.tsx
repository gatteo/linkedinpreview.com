'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

type SparklineProps = {
    data: number[]
    className?: string
    width?: number
    height?: number
    /** CSS color (defaults to currentColor so the parent can tint it). */
    color?: string
}

/**
 * A tiny dependency-free SVG sparkline. Renders a smooth area+line for a short
 * numeric series; degrades to a flat baseline when there is too little data.
 */
export function Sparkline({ data, className, width = 96, height = 28, color = 'currentColor' }: SparklineProps) {
    const gradientId = React.useId().replace(/:/g, '')

    if (data.length < 2) {
        return (
            <svg width={width} height={height} className={cn('overflow-visible', className)} aria-hidden>
                <line
                    x1={0}
                    y1={height - 2}
                    x2={width}
                    y2={height - 2}
                    stroke={color}
                    strokeOpacity={0.25}
                    strokeWidth={1.5}
                />
            </svg>
        )
    }

    const min = Math.min(...data)
    const max = Math.max(...data)
    const span = max - min || 1
    const stepX = width / (data.length - 1)
    const pad = 2

    const points = data.map((v, i) => {
        const x = i * stepX
        const y = pad + (height - pad * 2) * (1 - (v - min) / span)
        return [x, y] as const
    })

    const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
    const area = `${line} L${width},${height} L0,${height} Z`

    return (
        <svg width={width} height={height} className={cn('overflow-visible', className)} aria-hidden>
            <defs>
                <linearGradient id={gradientId} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor={color} stopOpacity={0.25} />
                    <stop offset='100%' stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path d={line} fill='none' stroke={color} strokeWidth={1.75} strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    )
}
