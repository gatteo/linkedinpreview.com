'use client'

import * as React from 'react'
import { CheckIcon } from 'lucide-react'

import { type BrandingData } from '@/lib/branding'
import { cn } from '@/lib/utils'
import { useBranding } from '@/hooks/use-branding'
import { Skeleton } from '@/components/ui/skeleton'

import { DosDontsSection } from './dos-donts-section'
import { ExpertiseSection } from './expertise-section'
import { FooterSection } from './footer-section'
import { InspirationCreatorsSection } from './inspiration-creators-section'
import { InspirationPostsSection } from './inspiration-posts-section'
import { KnowledgeBaseSection } from './knowledge-base-section'
import { PositioningSection } from './positioning-section'
import { ProfileSection } from './profile-section'
import { RoleSection } from './role-section'
import { WritingStyleSection } from './writing-style-section'

function SaveIndicator({ visible }: { visible: boolean }) {
    return (
        <div
            className={cn(
                'text-muted-foreground flex items-center gap-1.5 text-xs transition-opacity duration-300',
                visible ? 'opacity-100' : 'opacity-0',
            )}>
            <CheckIcon className='size-3.5 text-green-500' />
            All changes saved
        </div>
    )
}

function BrandingFormSkeleton() {
    return (
        <div className='max-w-2xl space-y-6 p-4 lg:p-6'>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className='space-y-4 rounded-xl border p-6'>
                    <Skeleton className='h-5 w-24' />
                    <Skeleton className='h-4 w-48' />
                    <Skeleton className='h-10 w-full' />
                </div>
            ))}
        </div>
    )
}

export function BrandingForm() {
    const { branding, isLoading, updateBranding } = useBranding()
    const [showSaved, setShowSaved] = React.useState(false)
    const savedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleUpdate = React.useCallback(
        (updates: Partial<BrandingData>) => {
            updateBranding(updates)
            setShowSaved(true)
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
            savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000)
        },
        [updateBranding],
    )

    React.useEffect(() => {
        return () => {
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
        }
    }, [])

    if (isLoading) return <BrandingFormSkeleton />

    return (
        <div className='relative max-w-2xl space-y-6 p-4 lg:p-6'>
            <div className='absolute top-4 right-4 lg:top-6 lg:right-6'>
                <SaveIndicator visible={showSaved} />
            </div>
            <ProfileSection branding={branding} onUpdate={handleUpdate} />
            <PositioningSection branding={branding} onUpdate={handleUpdate} />
            <RoleSection branding={branding} onUpdate={handleUpdate} />
            <ExpertiseSection branding={branding} onUpdate={handleUpdate} />
            <WritingStyleSection branding={branding} onUpdate={handleUpdate} />
            <FooterSection branding={branding} onUpdate={handleUpdate} />
            <KnowledgeBaseSection branding={branding} onUpdate={handleUpdate} />
            <DosDontsSection branding={branding} onUpdate={handleUpdate} />
            <InspirationPostsSection branding={branding} onUpdate={handleUpdate} />
            <InspirationCreatorsSection branding={branding} onUpdate={handleUpdate} />
        </div>
    )
}
