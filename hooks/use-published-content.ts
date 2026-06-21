'use client'

import * as React from 'react'

import { extractAllFeatures, type PostFeatures } from '@/lib/analytics/content-features'
import { fetchPublishedPostsContent } from '@/lib/supabase/published-posts'
import { useAuth } from '@/components/dashboard/auth-provider'

/**
 * Loads published-post bodies and derives per-post content features (keyed by
 * draft id) for the correlation engine. Kept separate from the drafts manifest
 * so the (heavier) content blobs are only fetched on the analytics surface.
 */
export function usePublishedContent() {
    const { isReady, userId, supabase } = useAuth()
    const [features, setFeatures] = React.useState<Map<string, PostFeatures>>(new Map())
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        if (!isReady || !userId) return

        let cancelled = false
        setIsLoading(true)
        fetchPublishedPostsContent(supabase)
            .then((content) => {
                if (!cancelled) {
                    setFeatures(extractAllFeatures(content))
                    setIsLoading(false)
                }
            })
            .catch(() => {
                // Non-fatal: correlation insights simply stay hidden.
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [isReady, userId, supabase])

    return { features, isLoading }
}
