'use client'

import * as React from 'react'
import { ArrowDownRightIcon, ArrowUpRightIcon, DnaIcon } from 'lucide-react'

import type { PublishedPost } from '@/lib/analytics/aggregate'
import { analyzeContentDna } from '@/lib/analytics/content-dna'
import type { PostFeatures } from '@/lib/analytics/content-features'
import { formatCount } from '@/lib/analytics/format'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

import { SectionHeading } from './section-heading'

const MIN_SAMPLE = 4

type ContentDnaSectionProps = {
    posts: PublishedPost[]
    features: Map<string, PostFeatures>
}

export function ContentDnaSection({ posts, features }: ContentDnaSectionProps) {
    const dna = React.useMemo(() => analyzeContentDna(posts, features), [posts, features])

    return (
        <section className='space-y-4'>
            <SectionHeading
                icon={DnaIcon}
                title='Content DNA'
                subtitle='What actually drives your engagement, learned from your own posts'
            />

            {!dna.hasEnoughData ? (
                <Card>
                    <CardContent className='flex flex-col items-center gap-2 py-10 text-center'>
                        <DnaIcon className='text-muted-foreground size-6' />
                        <p className='text-sm font-medium'>Learning your content DNA</p>
                        <p className='text-muted-foreground max-w-sm text-xs'>
                            Add performance metrics to at least {MIN_SAMPLE} published posts and we’ll reveal which
                            formats, lengths, hooks, and timing lift your engagement.
                            {dna.sampleSize > 0 && ` (${dna.sampleSize}/${MIN_SAMPLE} ready)`}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <p className='text-muted-foreground text-xs'>
                        Compared to your baseline of{' '}
                        <span className='text-foreground font-medium'>
                            {formatCount(Math.round(dna.baselineAvgEngagement))} engagements/post
                        </span>{' '}
                        across {dna.sampleSize} posts with data.
                    </p>
                    <div className='grid gap-3 sm:grid-cols-2'>
                        {dna.drivers.map((driver) => {
                            const up = driver.direction === 'up'
                            const width = Math.min(100, Math.abs(driver.lift) * 100)
                            return (
                                <Card key={`${driver.dimension}-${driver.bucket}`}>
                                    <CardContent className='space-y-2'>
                                        <div className='flex items-center justify-between gap-2'>
                                            <div className='min-w-0'>
                                                <span className='text-muted-foreground text-[10px] font-semibold tracking-wider uppercase'>
                                                    {driver.dimension}
                                                </span>
                                                <p className='truncate text-sm font-semibold'>{driver.bucket}</p>
                                            </div>
                                            <span
                                                className={cn(
                                                    'flex shrink-0 items-center gap-0.5 text-lg font-bold',
                                                    up ? 'text-success' : 'text-error',
                                                )}>
                                                {up ? (
                                                    <ArrowUpRightIcon className='size-4' />
                                                ) : (
                                                    <ArrowDownRightIcon className='size-4' />
                                                )}
                                                {up ? '+' : ''}
                                                {Math.round(driver.lift * 100)}%
                                            </span>
                                        </div>
                                        <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                                            <div
                                                className={cn('h-full rounded-full', up ? 'bg-success' : 'bg-error')}
                                                style={{ width: `${Math.max(6, width)}%` }}
                                            />
                                        </div>
                                        <p className='text-muted-foreground text-xs'>
                                            Based on {driver.sampleSize} post{driver.sampleSize === 1 ? '' : 's'} ·{' '}
                                            {formatCount(Math.round(driver.avgEngagement))} avg engagements
                                        </p>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </>
            )}
        </section>
    )
}
