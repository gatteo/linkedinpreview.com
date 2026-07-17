'use client'

import { FeaturebaseProvider } from 'featurebase-js/react'

// ---------------------------------------------------------------------------
// Featurebase messenger (support + feedback)
//
// Mounted once in the dashboard layout - the portal is the only surface where
// the messenger should appear. Public pages, /embed, and /preview stay clean.
// The SDK reads the workspace's "Manage modules" toggles server-side, so
// enabled surfaces boot without per-surface flags here.
// ---------------------------------------------------------------------------

export function FeaturebaseRoot({ children }: { children: React.ReactNode }) {
    return <FeaturebaseProvider appId='6a59ce40db775d4fca119bd4'>{children}</FeaturebaseProvider>
}
