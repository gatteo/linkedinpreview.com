'use client'

import * as React from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Loader2Icon } from 'lucide-react'

import { env } from '@/env.mjs'
import type { CheckoutPlan } from '@/config/pricing'

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

    React.useEffect(() => {
        if (!stripePromise) {
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
                if (!res.ok) throw new Error('checkout-unavailable')
                const data = (await res.json()) as { clientSecret?: string }
                if (!data.clientSecret) throw new Error('no-client-secret')
                if (!cancelled) setClientSecret(data.clientSecret)
            })
            .catch(() => {
                if (!cancelled) onErrorRef.current()
            })
        return () => {
            cancelled = true
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
                options={{ clientSecret, onComplete: () => onCompleteRef.current() }}>
                <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
        </div>
    )
}
