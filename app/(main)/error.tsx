'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

// Route-level boundary for the public pages (home, blog, tool). Catches render
// and hydration failures - notably the Turbopack "module factory is not
// available" chunk error a stale-deploy visitor hits on the landing page - and
// offers a reload, which refetches the current manifest and recovers the page.
// Reported here too: once React catches the error the global capture_exceptions
// handler no longer sees it.
export default function MainError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        posthog.captureException(error)
    }, [error])

    return (
        <div className='flex min-h-[80vh] flex-col items-center justify-center gap-8 px-6'>
            <div className='max-w-md text-center'>
                <p className='text-muted-foreground mb-2 text-sm font-medium tracking-wider uppercase'>Error</p>
                <h1 className='font-heading text-foreground mb-4 text-4xl font-bold'>Something went wrong</h1>
                <p className='text-muted-foreground text-lg'>
                    The page didn&apos;t load correctly. Reloading usually fixes it - it fetches the latest version of
                    the app.
                </p>
            </div>
            <div className='flex items-center gap-3'>
                <button
                    onClick={() => window.location.reload()}
                    className='bg-primary text-primary-foreground shadow-subtle hover:bg-primary/90 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors'>
                    Reload the page
                </button>
                <button
                    onClick={() => reset()}
                    className='text-muted-foreground hover:text-foreground rounded-lg px-5 py-2.5 text-sm font-medium transition-colors'>
                    Try again
                </button>
            </div>
        </div>
    )
}
