'use client'

import * as React from 'react'

import type { CheckoutPlan } from '@/config/pricing'
import { usePlan } from '@/hooks/use-plan'

import { track } from './onboarding/ai'
import { UpgradeDialog } from './upgrade-dialog'

// ---------------------------------------------------------------------------
// Upgrade prompt context
//
// Any dashboard surface can call useUpgradePrompt().openUpgrade(reason) to fire
// the contextual paywall (e.g. on an AI daily-limit hit). The default value is a
// no-op so the same call is safe on the public tool (outside this provider).
// ---------------------------------------------------------------------------

type UpgradeContextValue = {
    openUpgrade: (reason?: string) => void
}

const UpgradeContext = React.createContext<UpgradeContextValue>({ openUpgrade: () => {} })

export function useUpgradePrompt(): UpgradeContextValue {
    return React.useContext(UpgradeContext)
}

export function UpgradeProvider({ children }: { children: React.ReactNode }) {
    const { refresh } = usePlan()
    const [open, setOpen] = React.useState(false)
    const [reason, setReason] = React.useState<string | undefined>(undefined)
    const [completedPlan, setCompletedPlan] = React.useState<CheckoutPlan | null>(null)

    const openUpgrade = React.useCallback((why?: string) => {
        setReason(why)
        setCompletedPlan(null)
        setOpen(true)
    }, [])

    // Hosted-checkout return: Stripe redirected back with the outcome in the
    // query params (the embedded flow completes in-dialog via onComplete).
    // Success reopens the dialog straight in its confirmation state.
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const status = params.get('checkout')
        if (!status || params.get('source') !== 'upgrade') return
        const plan: CheckoutPlan = params.get('plan') === 'monthly' ? 'monthly' : 'lifetime'
        params.delete('checkout')
        params.delete('plan')
        params.delete('source')
        params.delete('session_id')
        const qs = params.toString()
        window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
        if (status === 'success') {
            track('upgrade_success', { plan, reason: 'hosted_return' })
            refresh()
            setCompletedPlan(plan)
            setOpen(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const value = React.useMemo(() => ({ openUpgrade }), [openUpgrade])

    return (
        <UpgradeContext.Provider value={value}>
            {children}
            <UpgradeDialog open={open} onOpenChange={setOpen} reason={reason} completedPlan={completedPlan} />
        </UpgradeContext.Provider>
    )
}
