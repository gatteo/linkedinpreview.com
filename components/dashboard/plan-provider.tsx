'use client'

import * as React from 'react'

import { DEFAULT_BILLING, isPaidPlan, type BillingData, type Plan } from '@/lib/billing'
import { fetchBilling } from '@/lib/supabase/billing'
import { useAuth } from '@/components/dashboard/auth-provider'

// ---------------------------------------------------------------------------
// Shared plan state
//
// One source of truth for the user's plan across the dashboard (sidebar upgrade
// nag, paywall dialog, onboarding offer). `refresh()` polls a few times so the UI
// reflects a purchase as soon as the Stripe webhook lands, without a reload.
// ---------------------------------------------------------------------------

type PlanContextValue = {
    plan: Plan
    isPaid: boolean
    isLoading: boolean
    /** The full billing row (renewal date, Stripe ids) for the settings surface. */
    billing: BillingData
    refresh: () => void
}

const PlanContext = React.createContext<PlanContextValue>({
    plan: DEFAULT_BILLING.plan,
    isPaid: false,
    isLoading: false,
    billing: DEFAULT_BILLING,
    refresh: () => {},
})

export function usePlan(): PlanContextValue {
    return React.useContext(PlanContext)
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
    const { isReady, userId, supabase } = useAuth()
    const [billing, setBilling] = React.useState<BillingData>(DEFAULT_BILLING)
    const [isLoading, setIsLoading] = React.useState(true)
    const [nonce, setNonce] = React.useState(0)

    React.useEffect(() => {
        if (!isReady || !userId) return

        let cancelled = false
        setIsLoading(true)
        fetchBilling(supabase)
            .then((data) => {
                if (!cancelled) {
                    setBilling(data)
                    setIsLoading(false)
                }
            })
            .catch((err) => {
                // Billing read failure stays silent - the user just remains on 'free'.
                console.error('Failed to load billing', err)
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [isReady, userId, supabase, nonce])

    // Re-read now, then again after the webhook has had time to land.
    const refresh = React.useCallback(() => {
        setNonce((n) => n + 1)
        setTimeout(() => setNonce((n) => n + 1), 2500)
        setTimeout(() => setNonce((n) => n + 1), 6000)
    }, [])

    const value = React.useMemo<PlanContextValue>(
        () => ({ plan: billing.plan, isPaid: isPaidPlan(billing.plan), isLoading, billing, refresh }),
        [billing, isLoading, refresh],
    )

    return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}
