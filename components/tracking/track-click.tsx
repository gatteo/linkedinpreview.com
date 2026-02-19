'use client'

import type React from 'react'
import posthog from 'posthog-js'

export function TrackClick({
    event,
    properties,
    children,
}: {
    event: string
    properties?: Record<string, unknown>
    children: React.ReactNode
}) {
    return (
        <span onClick={() => posthog.capture(event, properties)} className='contents'>
            {children}
        </span>
    )
}
