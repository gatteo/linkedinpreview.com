'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

export function PostHogPageView() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (!pathname) return

        const search = searchParams.toString()
        const url = search ? `${pathname}?${search}` : pathname

        posthog?.capture('page_viewed', {
            pathname,
            search: search || null,
            url,
        })
    }, [pathname, searchParams])

    return null
}
