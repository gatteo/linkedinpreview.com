'use client'

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

/**
 * Generic hook for reading a PostHog feature flag client-side.
 *
 * Returns `undefined` while flags are loading (or when PostHog is not
 * initialized — e.g. in development where posthog.init is skipped), then
 * the variant key string once resolved.
 *
 * Usage:
 *   const { variant, isLoading } = usePostHogFlag('my-flag')
 */
export function usePostHogFlag(flagKey: string): { variant: string | undefined; isLoading: boolean } {
    const [variant, setVariant] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // PostHog is only initialized in production. When not initialized,
        // getFeatureFlag returns undefined — treat that as "control" (isLoading=false).
        const resolve = () => {
            const value = posthog.getFeatureFlag(flagKey)
            setVariant(typeof value === 'string' ? value : undefined)
            setIsLoading(false)
        }

        // If flags are already loaded, resolve immediately.
        if (posthog.__loaded) {
            resolve()
        } else {
            // Otherwise wait for the flags callback and resolve then.
            posthog.onFeatureFlags(resolve)
        }
    }, [flagKey])

    return { variant, isLoading }
}
