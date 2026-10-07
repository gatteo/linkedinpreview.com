'use client'

import * as React from 'react'
import posthog from 'posthog-js'

import { OB_EXPERIMENTS, type ObExperimentKey } from '@/config/onboarding-experiments'

/**
 * Resolve an onboarding experiment variant ONCE per mount - a flag response
 * landing mid-flow must never flip copy under the user. Falls back to control
 * while flags load, in dev (PostHog uninitialized), and for unknown variants,
 * so experiments skew toward control on slow connections (acceptable: PostHog
 * only counts exposures it logged via this read). Captured events carry
 * $feature/<key> automatically - no extra analysis plumbing needed.
 */
export function readObExperimentVariant(key: ObExperimentKey): string | undefined {
    try {
        const value = posthog?.getFeatureFlag?.(key)
        return typeof value === 'string' ? value : undefined
    } catch {
        return undefined
    }
}

export function useObExperiment<K extends ObExperimentKey>(
    key: K,
    assignedVariant?: string,
): (typeof OB_EXPERIMENTS)[K]['control'] {
    const [variant] = React.useState<string>(() => assignedVariant ?? readObExperimentVariant(key) ?? 'control')
    const variants = OB_EXPERIMENTS[key] as Record<string, (typeof OB_EXPERIMENTS)[K]['control']>
    return Object.hasOwn(variants, variant) ? variants[variant] : variants.control
}
