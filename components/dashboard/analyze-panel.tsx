'use client'

import React from 'react'
import { BarChart3, CheckCircle, ChevronRight, Loader2, RefreshCw, Sparkles, XCircle } from 'lucide-react'
import posthog from 'posthog-js'
import { toast } from 'sonner'

import { ApiRoutes } from '@/config/routes'
import { fetchSuggestions, type Suggestion } from '@/lib/ai-suggestions'
import { computeContentStats } from '@/lib/content-scoring'
import { getPostAnalytics } from '@/lib/post-analytics'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number): string {
    if (score >= 70) return 'text-green-500'
    if (score >= 40) return 'text-amber-500'
    return 'text-red-500'
}

function scoreBarColor(score: number): string {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
}

function sentimentColor(s: string) {
    if (s === 'positive') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (s === 'negative') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    return 'bg-muted text-muted-foreground'
}

function suggestionTypeColor(type: string) {
    switch (type) {
        case 'content':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        case 'structure':
            return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
        case 'tone':
            return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
        case 'engagement':
            return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
        default:
            return 'bg-muted text-muted-foreground'
    }
}

function formatCategory(cat: string) {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ---------------------------------------------------------------------------
// Circular gauge
// ---------------------------------------------------------------------------

function CircularGauge({ score }: { score: number }) {
    const radius = 35
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    return (
        <svg width='80' height='80' viewBox='0 0 80 80'>
            <circle
                cx='40'
                cy='40'
                r={radius}
                fill='none'
                stroke='currentColor'
                strokeWidth='6'
                className='text-muted/30'
            />
            <circle
                cx='40'
                cy='40'
                r={radius}
                fill='none'
                stroke='currentColor'
                strokeWidth='6'
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap='round'
                className={scoreColor(score)}
                style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center',
                    transition: 'stroke-dashoffset 0.5s ease',
                }}
            />
            <text
                x='40'
                y='40'
                textAnchor='middle'
                dominantBaseline='central'
                className='fill-foreground text-lg font-bold'
                fontSize='16'
                fontWeight='700'>
                {score}
            </text>
        </svg>
    )
}

// ---------------------------------------------------------------------------
// Sub-score bar
// ---------------------------------------------------------------------------

function SubScore({ label, score }: { label: string; score: number }) {
    return (
        <div className='flex items-center gap-2'>
            <span className='text-muted-foreground w-24 shrink-0 text-xs'>{label}</span>
            <div className='bg-muted h-1.5 flex-1 overflow-hidden rounded-full'>
                <div
                    className={cn('h-full rounded-full transition-all duration-500', scoreBarColor(score))}
                    style={{ width: `${score}%` }}
                />
            </div>
            <span className={cn('w-6 shrink-0 text-right text-xs font-medium tabular-nums', scoreColor(score))}>
                {score}
            </span>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Stats section
// ---------------------------------------------------------------------------

function StatsSection({ text }: { text: string }) {
    const stats = React.useMemo(() => computeContentStats(text), [text])
    const dist = stats.sentenceDistribution
    const distEntries = [
        { key: 'tiny', label: 'Tiny', value: dist.tiny, color: 'bg-blue-400' },
        { key: 'short', label: 'Short', value: dist.short, color: 'bg-green-400' },
        { key: 'medium', label: 'Medium', value: dist.medium, color: 'bg-yellow-400' },
        { key: 'long', label: 'Long', value: dist.long, color: 'bg-orange-400' },
        { key: 'veryLong', label: 'Very Long', value: dist.veryLong, color: 'bg-red-400' },
    ]

    return (
        <div className='space-y-3'>
            <h3 className='text-foreground text-xs font-semibold tracking-wider uppercase'>Stats</h3>

            <div className='space-y-2.5'>
                {/* Readability */}
                <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground text-xs'>Readability</span>
                    <span className='text-foreground text-xs font-medium'>
                        {stats.readabilityGrade} - {stats.readabilityLabel}
                    </span>
                </div>

                {/* Sentence mix */}
                <div>
                    <span className='text-muted-foreground mb-1 block text-xs'>Sentence mix</span>
                    <div className='bg-muted flex h-2 overflow-hidden rounded-full'>
                        {distEntries.map((e) =>
                            e.value > 0 ? (
                                <div
                                    key={e.key}
                                    className={e.color}
                                    style={{ width: `${e.value}%` }}
                                    title={`${e.label}: ${e.value}%`}
                                />
                            ) : null,
                        )}
                    </div>
                    <div className='mt-1 flex flex-wrap gap-x-3 gap-y-0.5'>
                        {distEntries
                            .filter((e) => e.value > 0)
                            .map((e) => (
                                <span key={e.key} className='text-muted-foreground flex items-center gap-1 text-xs'>
                                    <span className={cn('inline-block size-1.5 rounded-full', e.color)} />
                                    {e.label} {e.value}%
                                </span>
                            ))}
                    </div>
                </div>

                {/* Counts row */}
                <div className='grid grid-cols-2 gap-x-4 gap-y-1.5'>
                    <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground text-xs'>Characters</span>
                        <span className='text-foreground text-xs font-medium tabular-nums'>{stats.charCount}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground text-xs'>Words</span>
                        <span className='text-foreground text-xs font-medium tabular-nums'>{stats.wordCount}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground text-xs'>Lines</span>
                        <span className='text-foreground text-xs font-medium tabular-nums'>{stats.lineCount}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground text-xs'>Emojis</span>
                        <span className='text-foreground text-xs font-medium tabular-nums'>{stats.emojiCount}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground text-xs'>Hashtags</span>
                        <span className='text-foreground text-xs font-medium tabular-nums'>
                            {stats.hashtagCount}{' '}
                            <span className='text-muted-foreground font-normal'>/ {stats.recommendedHashtags}</span>
                        </span>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground text-xs'>Length</span>
                        <span
                            className={cn(
                                'text-xs font-medium',
                                stats.lengthStatus === 'optimal' ? 'text-green-500' : 'text-red-500',
                            )}>
                            {stats.lengthStatus === 'optimal'
                                ? 'Optimal'
                                : stats.lengthStatus === 'too_short'
                                  ? 'Too short'
                                  : 'Too long'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
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
