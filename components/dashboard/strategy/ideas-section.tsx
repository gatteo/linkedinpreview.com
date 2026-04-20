'use client'

import * as React from 'react'
import { SparklesIcon } from 'lucide-react'

import type { BrandingData } from '@/lib/branding'
import type { DraftManifestEntry } from '@/lib/drafts'
import type { PostIdea, StrategyData, WeeklyIdeas } from '@/lib/strategy'
import { STRATEGY_AUDIENCES, STRATEGY_GOALS } from '@/lib/strategy'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { IdeaCard } from './idea-card'

type IdeasSectionProps = {
    strategy: StrategyData
    branding: BrandingData
    drafts: DraftManifestEntry[]
    onUpdateStrategy: (updates: Partial<StrategyData>) => void
}

function getMondayOfWeek(date = new Date()): string {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
}

function isCurrentWeek(weekOf: string): boolean {
    const weekOfDate = new Date(weekOf)
    const currentMonday = new Date(getMondayOfWeek())
    return weekOfDate.getTime() === currentMonday.getTime()
}

export function IdeasSection({ strategy, branding, drafts, onUpdateStrategy }: IdeasSectionProps) {
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const weeklyIdeas = strategy.weeklyIdeas
    const hasCurrentIdeas = weeklyIdeas !== null && isCurrentWeek(weeklyIdeas.weekOf)

    const handleGenerateIdeas = async () => {
        setIsGenerating(true)
        setError(null)

        const goalLabels = strategy.goals
            .map((g) => STRATEGY_GOALS.find((sg) => sg.value === g)?.label)
            .filter(Boolean) as string[]

        const audienceLabels = strategy.audience
            .map((a) => STRATEGY_AUDIENCES.find((sa) => sa.value === a)?.label)
            .filter(Boolean) as string[]

        const enabledFormats = strategy.formats.filter((f) => f.enabled).map((f) => f.name)

        const recentTitles = drafts
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 20)
            .map((d) => d.title)
            .filter((t) => t && t !== 'Untitled')

        try {
            const res = await fetch('/api/ideas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goals: goalLabels,
                    audience: audienceLabels,
                    topics: branding.expertise.topics.filter(Boolean),
                    formats: enabledFormats,
                    positioning: branding.positioning.statement,
                    recentTitles,
                }),
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body?.error ?? `Request failed with status ${res.status}`)
            }

            const data = (await res.json()) as { ideas: PostIdea[] }

            const newWeeklyIdeas: WeeklyIdeas = {
                ideas: data.ideas,
                generatedAt: new Date().toISOString(),
                weekOf: getMondayOfWeek(),
            }

            onUpdateStrategy({ weeklyIdeas: newWeeklyIdeas })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate ideas')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <section>
            <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-base font-semibold'>Post Ideas</h2>
                <Button
                    size='sm'
                    variant={hasCurrentIdeas ? 'outline' : 'default'}
                    onClick={handleGenerateIdeas}
                    disabled={isGenerating}>
                    <SparklesIcon className='mr-1.5 size-3.5' />
                    {isGenerating ? 'Generating...' : hasCurrentIdeas ? 'Regenerate Ideas' : 'Generate Ideas'}
                </Button>
            </div>

            {error && <p className='text-destructive mb-4 text-sm'>{error}</p>}

            {isGenerating ? (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className='border-border space-y-3 rounded-xl border p-4'>
                            <Skeleton className='h-4 w-20 rounded-full' />
                            <Skeleton className='h-4 w-full' />
                            <Skeleton className='h-4 w-3/4' />
                            <Skeleton className='h-16 w-full' />
                            <Skeleton className='h-8 w-full' />
                        </div>
                    ))}
                </div>
            ) : hasCurrentIdeas ? (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {weeklyIdeas!.ideas.map((idea, i) => (
                        <IdeaCard key={i} idea={idea} />
                    ))}
                </div>
            ) : (
                <div className='border-border flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center'>
                    <div className='bg-muted flex size-10 items-center justify-center rounded-full'>
                        <SparklesIcon className='text-muted-foreground size-5' />
                    </div>
                    <div>
                        <p className='font-medium'>No ideas yet</p>
                        <p className='text-muted-foreground mt-1 text-sm'>
                            Generate ideas to get AI-powered post suggestions
                        </p>
                    </div>
                </div>
            )}
        </section>
    )
}
