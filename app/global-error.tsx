'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

// Last-resort boundary: only renders when the root layout itself throws, so it
// must ship its own <html>/<body>. A hard reload refetches the current build
// manifest, which resolves the stale-deploy chunk mismatch that leaves a
// visitor on a blank page (see app/(main)/error.tsx for the common case).
export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        posthog.captureException(error)
    }, [error])

    return (
        <html lang='en'>
            <body className='bg-white text-neutral-900'>
                <div className='flex min-h-screen flex-col items-center justify-center gap-8 px-6'>
                    <div className='max-w-md text-center'>
                        <h1 className='mb-4 text-2xl font-bold'>Something went wrong</h1>
                        <p className='text-neutral-600'>
                            The page failed to load. Reloading usually fixes it - it fetches the latest version of the
                            app.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className='rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700'>
                        Reload the page
                    </button>
                </div>
            </body>
        </html>
    )
}
