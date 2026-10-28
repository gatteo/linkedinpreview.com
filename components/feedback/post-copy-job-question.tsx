'use client'

import React from 'react'
import { X } from 'lucide-react'
import posthog from 'posthog-js'

import { VISITOR_JOBS, type DiscoverySource, type VisitorJob } from '@/lib/post-copy-discovery'

export function PostCopyJobQuestion({
    properties,
    onFinish,
}: {
    properties: { source: DiscoverySource; experiment_overlap: 'local_marker_present' | 'unknown' }
    onFinish: (job?: VisitorJob) => void
}) {
    const exposedRef = React.useRef(false)
    const questionRef = React.useRef<HTMLElement>(null)

    React.useEffect(() => {
        const element = questionRef.current
        if (!element) return
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting || exposedRef.current) return
            exposedRef.current = true
            try {
                posthog?.capture('post_copy_job_exposed', properties)
            } catch {}
            observer.disconnect()
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [properties])

    React.useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onFinish()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [onFinish])

    return (
        <section
            ref={questionRef}
            aria-label='Optional visitor question'
            className='bg-card text-card-foreground border-border mt-4 rounded-xl border p-4'>
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
            <div className='mt-3 grid gap-2 sm:grid-cols-2'>
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
        </section>
    )
}
