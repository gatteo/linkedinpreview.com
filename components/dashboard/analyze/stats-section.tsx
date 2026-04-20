import React from 'react'

import { computeContentStats } from '@/lib/content-scoring'
import { cn } from '@/lib/utils'

export function StatsSection({ text }: { text: string }) {
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
                <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground text-xs'>Readability</span>
                    <span className='text-foreground text-xs font-medium'>
                        {stats.readabilityGrade} - {stats.readabilityLabel}
                    </span>
                </div>

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
