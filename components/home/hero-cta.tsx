'use client'

/**
 * PostHog feature flag: `hero-cta-copy`
 *
 * Set up a multivariate feature flag in the PostHog dashboard with the
 * following variant keys. Each key maps to the button copy defined in
 * CTA_VARIANTS below. Rollout % and distribution are configured in PostHog.
 *
 * Variant keys and their intended copy:
 *   control     → "Get Started"        / "Learn more"           (current copy, default)
 *   free-tool   → "Use Free Tool"      / "See How It Works"
 *   try-free    → "Try It Free — No Login" / "See Features"
 *   open-editor → "Open Free Editor"  / "Learn More"
 *
 * Steps to configure in PostHog:
 *   1. Go to Feature Flags → New Feature Flag
 *   2. Key: hero-cta-copy
 *   3. Type: Multivariate
 *   4. Add the variant keys listed above with your desired rollout %
 *   5. Save and roll out to 100% of users once ready to run the experiment
 *
 * PostHog automatically records $feature_flag_called events, so no extra
 * tracking is needed to know which variant each user saw.
 */
import Link from 'next/link'
import { useFeatureFlagVariantKey } from 'posthog-js/react'

import { Routes } from '@/config/routes'

import { TrackClick } from '../tracking/track-click'
import { Button } from '../ui/button'

type CtaCopy = { primary: string; secondary: string }

const CONTROL: CtaCopy = { primary: 'Get Started', secondary: 'Learn more' }

const CTA_VARIANTS: Record<string, CtaCopy> = {
    'control': CONTROL,
    'free-tool': { primary: 'Use Free Tool', secondary: 'See How It Works' },
    'try-free': { primary: 'Try It Free — No Login', secondary: 'See Features' },
    'open-editor': { primary: 'Open Free Editor', secondary: 'Learn More' },
}

export function HeroCTA() {
    const variant = useFeatureFlagVariantKey('hero-cta-copy')

    // Fall back to control copy while loading or if the flag returns an unknown variant.
    const variantKey = typeof variant === 'string' ? variant : 'control'
    const copy = CTA_VARIANTS[variantKey] || CONTROL

    return (
        <div className='flex gap-2'>
            <TrackClick
                event='cta_button_clicked'
                properties={{ button_name: 'get_started', source: 'hero', variant: variantKey }}>
                <Button asChild>
                    <Link href={Routes.Tool}>{copy.primary}</Link>
                </Button>
            </TrackClick>
            <TrackClick
                event='cta_button_clicked'
                properties={{ button_name: 'learn_more', source: 'hero', variant: variantKey }}>
                <Button variant='secondary' asChild>
                    <Link href={Routes.MainFeatures}>{copy.secondary}</Link>
                </Button>
            </TrackClick>
        </div>
    )
}
