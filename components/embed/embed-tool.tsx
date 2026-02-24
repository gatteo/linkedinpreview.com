'use client'

import React from 'react'
import Link from 'next/link'

import { Tool } from '@/components/tool/tool'

export function EmbedTool() {
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const height = Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height)
                window.parent.postMessage({ type: 'linkedinpreview-resize', height }, '*')
            }
        })

        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <div ref={containerRef} className='flex flex-1 flex-col'>
            <div className='flex-1'>
                <Tool variant='embed' />
            </div>
            <div className='border-t border-border px-4 py-2 text-center text-xs text-muted-foreground'>
                Powered by{' '}
                <Link
                    href='https://linkedinpreview.com?utm_source=linkedinpreview.com&utm_medium=embed&utm_content=powered_by'
                    target='_blank'
                    className='underline hover:text-foreground'>
                    LinkedInPreview.com
                </Link>
            </div>
        </div>
    )
}
