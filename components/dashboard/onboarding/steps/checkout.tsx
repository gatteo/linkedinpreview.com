'use client'

import * as React from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Loader2Icon } from 'lucide-react'

import { env } from '@/env.mjs'
import { CHECKOUT_UI, type CheckoutPlan } from '@/config/pricing'
import { reportMissingEnv } from '@/lib/dev/report-missing-env'

import { track } from '../ai'

// Load Stripe.js once. Null when the publishable key is not configured yet, so
// the offer screen falls back gracefully to the free plan. Only needed for the
// embedded UI - hosted checkout is a plain redirect.
const stripePromise =
    CHECKOUT_UI === 'embedded' && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        ? loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
        : null

type OnboardingCheckoutProps = {
    plan: CheckoutPlan
    /** Which surface started the purchase - resumed after the hosted redirect. */
    source?: 'onboarding' | 'upgrade'
    onComplete: () => void
    onError: () => void
}

export function OnboardingCheckout({ plan, source = 'upgrade', onComplete, onError }: OnboardingCheckoutProps) {
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
        if (CHECKOUT_UI === 'embedded' && !stripePromise) {
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
            body: JSON.stringify({ plan, source }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const data = (await res.json().catch(() => ({}))) as { missing?: unknown }
                    reportMissingEnv('Stripe checkout', data.missing)
                    throw new Error('checkout-unavailable')
                }
                const data = (await res.json()) as { clientSecret?: string; url?: string }
                if (cancelled) return
                if (CHECKOUT_UI === 'hosted') {
                    if (!data.url) throw new Error('no-checkout-url')
                    track('onb_checkout_opened', { plan, ui: 'hosted' })
                    // The redirect ends this page - mark settled so the unmount
                    // is not counted as an abandon (cancel returns are tracked
                    // by the surface handling the ?checkout=cancelled param).
                    settledRef.current = true
                    window.location.assign(data.url)
                    return
                }
                if (!data.clientSecret) throw new Error('no-client-secret')
                openedRef.current = true
                track('onb_checkout_opened', { plan, ui: 'embedded' })
                setClientSecret(data.clientSecret)
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
    }, [plan, source])

    // Unmounting an opened checkout without completing = the user backed out of
    // the payment form (plan switch, decline, or navigation).
    React.useEffect(() => {
        return () => {
            if (openedRef.current && !settledRef.current) track('onb_checkout_abandoned', { plan })
        }
    }, [plan])

    if (CHECKOUT_UI === 'hosted') {
        return (
            <div className='flex flex-col items-center justify-center gap-3 py-12'>
                <Loader2Icon className='text-primary size-6 animate-spin' />
                <p className='text-muted-foreground text-sm'>Taking you to the secure Stripe checkout...</p>
            </div>
        )
    }

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
