'use client'

import * as React from 'react'

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
    const [open, setOpen] = React.useState(false)
    const [reason, setReason] = React.useState<string | undefined>(undefined)

    const openUpgrade = React.useCallback((why?: string) => {
        setReason(why)
        setOpen(true)
    }, [])

    const value = React.useMemo(() => ({ openUpgrade }), [openUpgrade])

    return (
        <UpgradeContext.Provider value={value}>
            {children}
            <UpgradeDialog open={open} onOpenChange={setOpen} reason={reason} />
        </UpgradeContext.Provider>
    )
}
