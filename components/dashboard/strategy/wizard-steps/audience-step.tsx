'use client'

import type { ReactNode } from 'react'
import {
    BriefcaseBusinessIcon,
    BuildingIcon,
    LandmarkIcon,
    SparklesIcon,
    UserCheckIcon,
    UserPlusIcon,
    UsersIcon,
} from 'lucide-react'

import { STRATEGY_AUDIENCES, type StrategyAudience } from '@/lib/strategy'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AudienceStepProps = {
    value: StrategyAudience[]
    onChange: (value: StrategyAudience[]) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUDIENCE_ICONS: Record<string, ReactNode> = {
    UserPlus: <UserPlusIcon className='size-4' />,
    Users: <UsersIcon className='size-4' />,
    Sparkles: <SparklesIcon className='size-4' />,
    Building: <BuildingIcon className='size-4' />,
    Landmark: <LandmarkIcon className='size-4' />,
    UserCheck: <UserCheckIcon className='size-4' />,
    BriefcaseBusiness: <BriefcaseBusinessIcon className='size-4' />,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AudienceStep({ value, onChange }: AudienceStepProps) {
    const toggle = (audience: StrategyAudience) => {
        if (value.includes(audience)) {
            onChange(value.filter((a) => a !== audience))
        } else {
            onChange([...value, audience])
        }
    }

    return (
        <div className='flex flex-wrap justify-center gap-3'>
            {STRATEGY_AUDIENCES.map((audience) => {
                const selected = value.includes(audience.value)
                return (
                    <button
                        key={audience.value}
                        type='button'
                        onClick={() => toggle(audience.value)}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                            selected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-muted/30 text-foreground hover:border-border/80 hover:bg-muted/50',
                        )}>
                        {AUDIENCE_ICONS[audience.icon]}
                        {audience.label}
                    </button>
                )
            })}
        </div>
    )
}
