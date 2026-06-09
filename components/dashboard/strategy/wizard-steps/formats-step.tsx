'use client'

import * as React from 'react'
import { Loader2Icon, RefreshCwIcon } from 'lucide-react'

import type { BrandingRole } from '@/lib/branding'
import {
    FORMAT_CATEGORIES,
    type FormatCategory,
    type StrategyAudience,
    type StrategyFormat,
    type StrategyGoal,
} from '@/lib/strategy'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormatsStepProps = {
    value: StrategyFormat[]
    onChange: (value: StrategyFormat[]) => void
    role: BrandingRole
    goals: StrategyGoal[]
    audience: StrategyAudience[]
    topics: string[]
}

type FilterTab = 'all' | FormatCategory

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<FormatCategory, string> = {
    personal: 'bg-violet-500',
    educational: 'bg-blue-500',
    organizational: 'bg-emerald-500',
    promotional: 'bg-amber-500',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FormatsStep({ value, onChange, role, goals, audience, topics }: FormatsStepProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState<FilterTab>('all')
    const hasFetched = React.useRef(false)

    const fetchFormats = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/strategy/formats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role,
                    goals,
                    audience,
                    topics: topics.filter(Boolean),
                }),
            })
            if (!res.ok) return
            const data = await res.json()
            if (data.formats) {
                onChange(
                    data.formats.map((f: { name: string; enabled: boolean; category: FormatCategory }) => ({
                        name: f.name,
                        enabled: f.enabled,
                        category:
                            f.category in FORMAT_CATEGORIES ? (FORMAT_CATEGORIES[f.name] ?? f.category) : f.category,
                    })),
                )
            }
        } catch {
            // silently fail
        } finally {
            setIsLoading(false)
        }
    }, [role, goals, audience, topics, onChange])

    React.useEffect(() => {
        if (hasFetched.current) return
        if (value.length > 0) return

        hasFetched.current = true
        fetchFormats()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const toggleFormat = (name: string) => {
        onChange(value.map((f) => (f.name === name ? { ...f, enabled: !f.enabled } : f)))
    }

    const selectedCount = value.filter((f) => f.enabled).length

    const filtered = activeTab === 'all' ? value : value.filter((f) => f.category === activeTab)

    const tabs: { key: FilterTab; label: string }[] = [
        { key: 'all', label: `All Selected (${selectedCount})` },
        { key: 'personal', label: 'Personal' },
        { key: 'educational', label: 'Educational' },
        { key: 'organizational', label: 'Organizational' },
        { key: 'promotional', label: 'Promotional' },
    ]

    if (isLoading) {
        return (
            <div className='text-muted-foreground flex w-full flex-col items-center justify-center gap-2 py-16 text-sm'>
                <Loader2Icon className='size-5 animate-spin' />
                Generating suggested formats...
            </div>
        )
    }

    return (
        <div className='flex w-full flex-col gap-4'>
            {/* Category filter tabs */}
            <div className='flex flex-wrap gap-1.5'>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type='button'
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                            activeTab === tab.key
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground',
                        )}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Format list */}
            <div className='flex flex-col gap-1'>
                {filtered.length === 0 ? (
                    <p className='text-muted-foreground py-8 text-center text-sm'>No formats in this category.</p>
                ) : (
                    filtered.map((format) => (
                        <div
                            key={format.name}
                            className='hover:bg-muted/40 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors'>
                            <div className={cn('size-2 shrink-0 rounded-full', CATEGORY_COLORS[format.category])} />
                            <span className='flex-1 text-sm'>{format.name}</span>
                            <Switch checked={format.enabled} onCheckedChange={() => toggleFormat(format.name)} />
                        </div>
                    ))
                )}
            </div>

            {/* Regenerate button */}
            <div className='flex justify-center pt-2'>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={() => fetchFormats()}
                    disabled={isLoading}
                    className='gap-1.5'>
                    <RefreshCwIcon className='size-3.5' />
                    Regenerate Suggestion
                </Button>
            </div>
        </div>
    )
}
