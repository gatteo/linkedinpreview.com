'use client'

import * as React from 'react'
import { PencilIcon } from 'lucide-react'

import type { BrandingData } from '@/lib/branding'
import type { StrategyData } from '@/lib/strategy'
import { useBranding } from '@/hooks/use-branding'
import { useDrafts } from '@/hooks/use-drafts'
import { useStrategy } from '@/hooks/use-strategy'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/dashboard/page-header'

import { StrategyDashboard } from './strategy-dashboard'
import { StrategyEmpty } from './strategy-empty'
import { StrategyWizard } from './strategy-wizard'

function StrategyPageSkeleton() {
    return (
        <div className='flex-1 space-y-6 overflow-y-auto p-4 lg:p-6'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-36 rounded-xl' />
                ))}
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className='h-64 rounded-xl' />
                ))}
            </div>
        </div>
    )
}

export function StrategyPage() {
    const { strategy, isLoading: strategyLoading, updateStrategy } = useStrategy()
    const { branding, isLoading: brandingLoading, updateBranding } = useBranding()
    const { drafts, isLoading: draftsLoading } = useDrafts()
    const [wizardOpen, setWizardOpen] = React.useState(false)

    const isLoading = strategyLoading || brandingLoading || draftsLoading

    const handleWizardComplete = React.useCallback(
        (strategyData: StrategyData, brandingUpdates: Partial<BrandingData>) => {
            updateStrategy(strategyData)
            updateBranding(brandingUpdates)
        },
        [updateStrategy, updateBranding],
    )

    const wizard = (
        <StrategyWizard
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            initialBranding={branding}
            initialStrategy={strategy}
            onComplete={handleWizardComplete}
        />
    )

    if (isLoading) {
        return (
            <>
                <PageHeader title='Content Strategy' />
                <StrategyPageSkeleton />
                {wizard}
            </>
        )
    }

    if (!strategy.completedAt) {
        return (
            <>
                <StrategyEmpty onCreateStrategy={() => setWizardOpen(true)} />
                {wizard}
            </>
        )
    }

    return (
        <>
            <PageHeader title='Content Strategy'>
                <Button variant='outline' size='sm' onClick={() => setWizardOpen(true)}>
                    <PencilIcon className='mr-1.5 size-3.5' />
                    Edit Strategy
                </Button>
            </PageHeader>
            <div className='flex-1 overflow-y-auto'>
                <StrategyDashboard
                    strategy={strategy}
                    branding={branding}
                    drafts={drafts}
                    onUpdateStrategy={updateStrategy}
                />
            </div>
            {wizard}
        </>
    )
}
