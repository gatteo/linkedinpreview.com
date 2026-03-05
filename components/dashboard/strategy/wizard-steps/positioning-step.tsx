'use client'

import * as React from 'react'
import { Loader2Icon } from 'lucide-react'

import type { BrandingRole } from '@/lib/branding'
import type { StrategyAudience, StrategyGoal } from '@/lib/strategy'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PositioningStepProps = {
    value: string
    onChange: (value: string) => void
    role: BrandingRole
    goals: StrategyGoal[]
    audience: StrategyAudience[]
    topics: string[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PositioningStep({ value, onChange, role, goals, audience, topics }: PositioningStepProps) {
    const [isGenerating, setIsGenerating] = React.useState(false)
    const hasFetched = React.useRef(false)

    React.useEffect(() => {
        if (hasFetched.current) return
        if (value.trim()) return

        hasFetched.current = true
        const generate = async () => {
            setIsGenerating(true)
            try {
                const res = await fetch('/api/strategy/positioning', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        role,
                        goals,
                        audience,
                        topics: topics.filter(Boolean),
                    }),
                })
                if (!res.ok) {
                    onChange('')
                    return
                }
                const data = await res.json()
                if (data.statement) onChange(data.statement)
            } catch {
                // generation failed - user can type manually
            } finally {
                setIsGenerating(false)
            }
        }
        generate()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className='flex w-full flex-col gap-3'>
            <label className='text-sm font-medium'>Edit Statement:</label>
            {isGenerating ? (
                <div className='text-muted-foreground flex min-h-[160px] items-center justify-center gap-2 rounded-lg border p-4 text-sm'>
                    <Loader2Icon className='size-4 animate-spin' />
                    Generating your positioning statement...
                </div>
            ) : (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={6}
                    placeholder='e.g. I help SaaS founders grow their personal brand by sharing product expertise and lessons learned.'
                    className='border-input bg-background focus-visible:ring-ring/50 placeholder:text-muted-foreground w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2'
                />
            )}
        </div>
    )
}
