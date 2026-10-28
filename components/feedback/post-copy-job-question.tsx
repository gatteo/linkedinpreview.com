'use client'

import React from 'react'
import { X } from 'lucide-react'
import posthog from 'posthog-js'
import { createPortal } from 'react-dom'

import { VISITOR_JOBS, type DiscoverySource, type VisitorJob } from '@/lib/post-copy-discovery'

export function PostCopyJobQuestion({
    properties,
    onFinish,
}: {
    properties: { source: DiscoverySource; experiment_overlap: 'local_marker_present' | 'unknown' }
    onFinish: (job?: VisitorJob) => void
}) {
    const exposedRef = React.useRef(false)

    React.useEffect(() => {
        if (exposedRef.current) return
        exposedRef.current = true
        try {
            posthog?.capture('post_copy_job_exposed', properties)
        } catch {}
    }, [properties])

    React.useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onFinish()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [onFinish])

    return createPortal(
        <section
            aria-label='Optional visitor question'
            className='bg-card text-card-foreground border-border fixed right-4 bottom-4 left-4 z-50 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border p-4 shadow-lg sm:left-auto sm:w-80'>
            <div className='flex items-start justify-between gap-3'>
                <div>
                    <p className='text-muted-foreground mb-1 text-xs'>Optional · Help shape this tool</p>
                    <h2 className='text-sm font-semibold'>What are you preparing today?</h2>
                </div>
                <button
                    type='button'
                    aria-label='Dismiss visitor question'
                    onClick={() => onFinish()}
                    className='hover:bg-muted focus-visible:ring-ring -mt-1 -mr-1 rounded-md p-2 focus-visible:ring-2'>
                    <X className='size-4' />
                </button>
            </div>
            <div className='mt-3 flex flex-col gap-2'>
                {VISITOR_JOBS.map((job) => (
                    <button
                        type='button'
                        key={job.value}
                        onClick={() => onFinish(job.value)}
                        className='border-border hover:bg-muted focus-visible:ring-ring min-h-11 rounded-md border px-3 py-2 text-left text-sm focus-visible:ring-2'>
                        {job.label}
                    </button>
                ))}
            </div>
        </section>,
        document.body,
    )
}
