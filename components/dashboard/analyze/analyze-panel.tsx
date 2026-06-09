'use client'

import React from 'react'
import { BarChart3, CheckCircle, ChevronRight, Loader2, RefreshCw, Sparkles, XCircle } from 'lucide-react'
import posthog from 'posthog-js'
import { toast } from 'sonner'

import { ApiRoutes } from '@/config/routes'
import { fetchSuggestions, type Suggestion } from '@/lib/ai-suggestions'
import { formatCategory, sentimentColor, suggestionTypeColor } from '@/lib/analyze-utils'
import { getPostAnalytics } from '@/lib/post-analytics'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { CircularGauge } from './circular-gauge'
import { StatsSection } from './stats-section'
import { SubScore } from './sub-score'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Analysis = {
    score: number
    hook_score: number
    readability_score: number
    cta_score: number
    engagement_score: number
    strengths: string[]
    improvements: string[]
    topics: string[]
    sentiment: 'positive' | 'neutral' | 'negative'
    category: string
    tone: string
    has_hook: boolean
    has_cta: boolean
    hook_quality: 'weak' | 'moderate' | 'strong'
}

type AnalyzePanelProps = {
    content: any
    contentText: string
    hasImage: boolean
    onApplySuggestion: (newText: string) => void
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AnalyzePanel({ content, contentText, hasImage, onApplySuggestion }: AnalyzePanelProps) {
    const [analysis, setAnalysis] = React.useState<Analysis | null>(null)
    const [isAnalyzing, setIsAnalyzing] = React.useState(false)
    const [lastAnalyzedText, setLastAnalyzedText] = React.useState<string | null>(null)
    const [suggestions, setSuggestions] = React.useState<Suggestion[]>([])
    const [isFetchingSuggestions, setIsFetchingSuggestions] = React.useState(false)
    const [applyingIndex, setApplyingIndex] = React.useState<number | null>(null)

    const hasChanged = analysis !== null && contentText !== lastAnalyzedText

    const handleAnalyze = React.useCallback(async () => {
        if (!contentText.trim()) {
            toast.error('Write something first before analyzing')
            return
        }

        setIsAnalyzing(true)
        setIsFetchingSuggestions(true)
        setSuggestions([])

        try {
            const analytics = getPostAnalytics(content, contentText, hasImage)

            const res = await fetch(ApiRoutes.Analyze, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postText: contentText,
                    hasImage: analytics.has_image,
                    hasFormatting: analytics.has_formatting,
                    contentLength: analytics.content_length,
                    lineCount: analytics.line_count,
                    hashtagCount: analytics.hashtag_count,
                    emojiCount: analytics.emoji_count,
                }),
            })

            if (!res.ok) {
                const data = (await res.json().catch(() => ({}))) as { error?: string }
                toast.error(data.error ?? 'Analysis failed')
                return
            }

            const data = (await res.json()) as { success: boolean; analysis: Analysis }
            setAnalysis(data.analysis)
            setLastAnalyzedText(contentText)
            posthog?.capture('post_analyzed_panel', { content_length: contentText.length })
        } catch {
            toast.error('Failed to analyze post')
        } finally {
            setIsAnalyzing(false)
        }

        // Fetch suggestions in parallel (non-blocking for analysis display)
        fetchSuggestions(contentText)
            .then((s) => setSuggestions(s))
            .catch(() => {})
            .finally(() => setIsFetchingSuggestions(false))
    }, [content, contentText, hasImage])

    const handleApplySuggestion = React.useCallback(
        async (suggestion: Suggestion, index: number) => {
            setApplyingIndex(index)
            try {
                const res = await fetch(ApiRoutes.Generate, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'apply-suggestion',
                        postText: contentText,
                        suggestion: suggestion.text,
                    }),
                })

                if (!res.ok) {
                    toast.error('Failed to apply suggestion')
                    return
                }

                const data = (await res.json()) as { result?: string }
                if (data.result) {
                    onApplySuggestion(data.result)
                    toast.success('Suggestion applied')
                }
            } catch {
                toast.error('Failed to apply suggestion')
            } finally {
                setApplyingIndex(null)
            }
        },
        [contentText, onApplySuggestion],
    )

    return (
        <div className='flex h-full flex-col overflow-y-auto'>
            <div className='flex-1 space-y-6 p-4'>
                {/* Analyze button + score */}
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <h3 className='text-foreground text-xs font-semibold tracking-wider uppercase'>Post Score</h3>
                        <Button
                            size='sm'
                            variant={analysis ? 'outline' : 'default'}
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className='h-7 gap-1.5 text-xs'>
                            {isAnalyzing ? (
                                <Loader2 className='size-3 animate-spin' />
                            ) : analysis ? (
                                <RefreshCw className='size-3' />
                            ) : (
                                <BarChart3 className='size-3' />
                            )}
                            {isAnalyzing ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze'}
                        </Button>
                    </div>

                    {hasChanged && !isAnalyzing && (
                        <p className='text-muted-foreground text-xs'>Content has changed since last analysis.</p>
                    )}

                    {isAnalyzing ? (
                        <div className='space-y-3'>
                            <div className='flex items-center gap-4'>
                                <Skeleton className='size-20 rounded-full' />
                                <div className='flex-1 space-y-2'>
                                    <Skeleton className='h-3 w-full' />
                                    <Skeleton className='h-3 w-full' />
                                    <Skeleton className='h-3 w-full' />
                                </div>
                            </div>
                            <Skeleton className='h-4 w-24 rounded-full' />
                        </div>
                    ) : analysis ? (
                        <div className='space-y-3'>
                            <div className='flex items-center gap-4'>
                                <CircularGauge score={analysis.score} />
                                <div className='flex-1 space-y-2'>
                                    <SubScore label='Hook' score={analysis.hook_score} />
                                    <SubScore label='Readability' score={analysis.readability_score} />
                                    <SubScore label='CTA' score={analysis.cta_score} />
                                </div>
                            </div>

                            {/* Badges */}
                            <div className='flex flex-wrap gap-1.5'>
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                        sentimentColor(analysis.sentiment),
                                    )}>
                                    {analysis.sentiment}
                                </span>
                                <span className='bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'>
                                    {formatCategory(analysis.category)}
                                </span>
                                <span className='bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'>
                                    {analysis.tone}
                                </span>
                            </div>

                            {/* Hook / CTA flags */}
                            <div className='flex items-center gap-3'>
                                <div className='flex items-center gap-1 text-xs'>
                                    {analysis.has_hook ? (
                                        <CheckCircle className='size-3 text-green-500' />
                                    ) : (
                                        <XCircle className='size-3 text-red-500' />
                                    )}
                                    <span className='text-muted-foreground'>Hook</span>
                                    {analysis.has_hook && (
                                        <span className='text-muted-foreground'>({analysis.hook_quality})</span>
                                    )}
                                </div>
                                <div className='flex items-center gap-1 text-xs'>
                                    {analysis.has_cta ? (
                                        <CheckCircle className='size-3 text-green-500' />
                                    ) : (
                                        <XCircle className='size-3 text-red-500' />
                                    )}
                                    <span className='text-muted-foreground'>CTA</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className='border-border rounded-lg border border-dashed p-4 text-center'>
                            <BarChart3 className='text-muted-foreground mx-auto mb-2 size-6' />
                            <p className='text-muted-foreground text-xs'>Click Analyze to score your post</p>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className='border-border border-t' />

                {/* Strengths & Improvements */}
                {analysis && !isAnalyzing && (
                    <>
                        <div className='space-y-3'>
                            <h3 className='text-foreground text-xs font-semibold tracking-wider uppercase'>
                                Strengths
                            </h3>
                            <ul className='space-y-1.5'>
                                {analysis.strengths.map((s, i) => (
                                    <li key={i} className='flex items-start gap-2 text-xs'>
                                        <CheckCircle className='mt-0.5 size-3 shrink-0 text-green-500' />
                                        <span className='text-muted-foreground'>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className='space-y-3'>
                            <h3 className='text-foreground text-xs font-semibold tracking-wider uppercase'>
                                Improvements
                            </h3>
                            <ul className='space-y-1.5'>
                                {analysis.improvements.map((s, i) => (
                                    <li key={i} className='flex items-start gap-2 text-xs'>
                                        <ChevronRight className='text-muted-foreground mt-0.5 size-3 shrink-0' />
                                        <span className='text-muted-foreground'>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className='border-border border-t' />
                    </>
                )}

                {/* Suggestions */}
                <div className='space-y-3'>
                    <h3 className='text-foreground text-xs font-semibold tracking-wider uppercase'>Suggestions</h3>

                    {isFetchingSuggestions ? (
                        <div className='space-y-2'>
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className='h-12 w-full rounded-lg' />
                            ))}
                        </div>
                    ) : suggestions.length > 0 ? (
                        <ul className='space-y-2'>
                            {suggestions.map((suggestion, i) => (
                                <li
                                    key={i}
                                    className='border-border bg-muted/30 flex items-start justify-between gap-2 rounded-lg border p-2.5'>
                                    <div className='min-w-0 flex-1 space-y-1'>
                                        <span
                                            className={cn(
                                                'inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium',
                                                suggestionTypeColor(suggestion.type),
                                            )}>
                                            {suggestion.type}
                                        </span>
                                        <p className='text-muted-foreground text-xs leading-relaxed'>
                                            {suggestion.text}
                                        </p>
                                    </div>
                                    <Button
                                        size='sm'
                                        variant='outline'
                                        onClick={() => handleApplySuggestion(suggestion, i)}
                                        disabled={applyingIndex !== null}
                                        className='h-6 shrink-0 px-2 text-xs'>
                                        {applyingIndex === i ? (
                                            <Loader2 className='size-3 animate-spin' />
                                        ) : (
                                            <Sparkles className='size-3' />
                                        )}
                                        Apply
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : analysis && !isFetchingSuggestions ? (
                        <p className='text-muted-foreground text-xs'>No suggestions available.</p>
                    ) : (
                        <div className='border-border rounded-lg border border-dashed p-4 text-center'>
                            <p className='text-muted-foreground text-xs'>Run Analyze to get AI suggestions</p>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className='border-border border-t' />

                {/* Stats */}
                <StatsSection text={contentText} />
            </div>
        </div>
    )
}
