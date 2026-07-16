'use client'

import * as React from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Loader2Icon } from 'lucide-react'

import { env } from '@/env.mjs'
import type { CheckoutPlan } from '@/config/pricing'
import { reportMissingEnv } from '@/lib/dev/report-missing-env'

import { track } from '../ai'

// Load Stripe.js once. Null when the publishable key is not configured yet, so
// the offer screen falls back gracefully to the free plan.
const stripePromise = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null

type OnboardingCheckoutProps = {
    plan: CheckoutPlan
    onComplete: () => void
    onError: () => void
}

export function OnboardingCheckout({ plan, onComplete, onError }: OnboardingCheckoutProps) {
    const [clientSecret, setClientSecret] = React.useState<string | null>(null)
    const onCompleteRef = React.useRef(onComplete)
    const onErrorRef = React.useRef(onError)
    // Keep the latest callbacks without re-running the checkout-creation effect
    // (the parent passes inline arrows that change identity every render).
    React.useEffect(() => {
        onCompleteRef.current = onComplete
        onErrorRef.current = onError
    })

    // The gap between onb_offer_select and onb_purchase_success is where payment
    // friction hides - instrument the checkout's own lifecycle.
    const settledRef = React.useRef(false)
    const openedRef = React.useRef(false)

    React.useEffect(() => {
        openedRef.current = false
        if (!stripePromise) {
            reportMissingEnv('Stripe checkout', ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'])
            track('onb_checkout_failed', { plan, reason: 'unconfigured' })
            settledRef.current = true
            onErrorRef.current()
            return
        }
        let cancelled = false
        fetch('/api/billing/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const data = (await res.json().catch(() => ({}))) as { missing?: unknown }
                    reportMissingEnv('Stripe checkout', data.missing)
                    throw new Error('checkout-unavailable')
                }
                const data = (await res.json()) as { clientSecret?: string }
                if (!data.clientSecret) throw new Error('no-client-secret')
                if (!cancelled) {
                    openedRef.current = true
                    track('onb_checkout_opened', { plan })
                    setClientSecret(data.clientSecret)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    track('onb_checkout_failed', { plan, reason: 'create-failed' })
                    settledRef.current = true
                    onErrorRef.current()
                }
            })
        return () => {
            cancelled = true
        }
    }, [plan])

    // Unmounting an opened checkout without completing = the user backed out of
    // the payment form (plan switch, decline, or navigation).
    React.useEffect(() => {
        return () => {
            if (openedRef.current && !settledRef.current) track('onb_checkout_abandoned', { plan })
        }
    }, [plan])

    if (!clientSecret) {
        return (
            <div className='flex items-center justify-center py-12'>
                <Loader2Icon className='text-primary size-6 animate-spin' />
            </div>
        )
    }

    return (
        <div className='overflow-hidden rounded-xl'>
            <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{
                    clientSecret,
                    onComplete: () => {
                        settledRef.current = true
                        onCompleteRef.current()
                    },
                }}>
                <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
        </div>
    )
}
