'use client'

import type { BrandingData } from '@/lib/branding'
import type { DraftManifestEntry } from '@/lib/drafts'
import type { StrategyData } from '@/lib/strategy'

import { IdeasSection } from './ideas-section'
import { OverviewSection } from './overview-section'
import { ProgressSection } from './progress-section'

type StrategyDashboardProps = {
    strategy: StrategyData
    branding: BrandingData
    drafts: DraftManifestEntry[]
    onUpdateStrategy: (updates: Partial<StrategyData>) => void
}

export function StrategyDashboard({ strategy, branding, drafts, onUpdateStrategy }: StrategyDashboardProps) {
    return (
        <div className='space-y-8 p-4 lg:p-6'>
            <OverviewSection strategy={strategy} branding={branding} />
            <div className='border-border border-t' />
            <ProgressSection strategy={strategy} drafts={drafts} />
            <div className='border-border border-t' />
            <IdeasSection strategy={strategy} branding={branding} drafts={drafts} onUpdateStrategy={onUpdateStrategy} />
        </div>
    )
}
