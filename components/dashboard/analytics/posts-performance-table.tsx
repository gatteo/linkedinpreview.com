'use client'

import * as React from 'react'
import { ExternalLinkIcon, PencilIcon, PlusIcon } from 'lucide-react'

import type { PublishedPost } from '@/lib/analytics/aggregate'
import { formatCount, formatDate, formatPercent } from '@/lib/analytics/format'
import { EMPTY_METRIC_VALUES, hasAnyMetric, type MetricValues } from '@/lib/analytics/metrics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { MetricsEntryDialog } from './metrics-entry-dialog'

type PostsPerformanceTableProps = {
    posts: PublishedPost[]
    onSave: (draftId: string, values: MetricValues) => Promise<void>
    onRemove: (draftId: string) => Promise<void>
}

const SOURCE_LABELS: Record<string, string> = {
    manual: 'Manual',
    csv: 'Imported',
    linkedin_api: 'Synced',
}

export function PostsPerformanceTable({ posts, onSave, onRemove }: PostsPerformanceTableProps) {
    const [editing, setEditing] = React.useState<PublishedPost | null>(null)

    const currentValues: MetricValues = editing?.metrics
        ? {
              impressions: editing.metrics.impressions,
              reach: editing.metrics.reach,
              reactions: editing.metrics.reactions,
              comments: editing.metrics.comments,
              reshares: editing.metrics.reshares,
              saves: editing.metrics.saves,
              sends: editing.metrics.sends,
              linkClicks: editing.metrics.linkClicks,
              follows: editing.metrics.follows,
              profileViews: editing.metrics.profileViews,
          }
        : EMPTY_METRIC_VALUES

    return (
        <Card>
            <CardHeader>
                <CardTitle className='text-base'>Published posts</CardTitle>
            </CardHeader>
            <CardContent className='px-0'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='pl-4'>Post</TableHead>
                            <TableHead className='text-right'>Impressions</TableHead>
                            <TableHead className='text-right'>Engagement</TableHead>
                            <TableHead className='hidden text-right sm:table-cell'>Rate</TableHead>
                            <TableHead className='pr-4 text-right'>Metrics</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {posts.map((post) => {
                            const filled = post.metrics ? hasAnyMetric(post.metrics) : false
                            return (
                                <TableRow key={post.entry.id}>
                                    <TableCell className='max-w-[280px] pl-4'>
                                        <div className='flex items-center gap-1.5'>
                                            <span className='truncate font-medium'>
                                                {post.entry.title || 'Untitled'}
                                            </span>
                                            {post.entry.linkedinPostUrl && (
                                                <a
                                                    href={post.entry.linkedinPostUrl}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                    className='text-muted-foreground hover:text-foreground shrink-0'>
                                                    <ExternalLinkIcon className='size-3.5' />
                                                </a>
                                            )}
                                        </div>
                                        <span className='text-muted-foreground text-xs'>
                                            {formatDate(post.publishedAt)}
                                        </span>
                                    </TableCell>
                                    <TableCell className='text-right tabular-nums'>
                                        {formatCount(post.impressions)}
                                    </TableCell>
                                    <TableCell className='text-right tabular-nums'>
                                        {formatCount(post.engagement)}
                                    </TableCell>
                                    <TableCell className='hidden text-right tabular-nums sm:table-cell'>
                                        {formatPercent(post.engagementRate)}
                                    </TableCell>
                                    <TableCell className='pr-4 text-right'>
                                        {filled ? (
                                            <div className='flex items-center justify-end gap-2'>
                                                <Badge variant='secondary' className='hidden md:inline-flex'>
                                                    {SOURCE_LABELS[post.metrics?.source ?? 'manual'] ?? 'Manual'}
                                                </Badge>
                                                <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    className='h-7 px-2'
                                                    onClick={() => setEditing(post)}>
                                                    <PencilIcon className='size-3.5' />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                className='h-7 px-2 text-xs'
                                                onClick={() => setEditing(post)}>
                                                <PlusIcon className='size-3.5' />
                                                Add
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>

            {editing && (
                <MetricsEntryDialog
                    open={editing !== null}
                    onOpenChange={(open) => !open && setEditing(null)}
                    title={editing.entry.title || 'Untitled'}
                    initial={currentValues}
                    hasExisting={editing.metrics ? hasAnyMetric(editing.metrics) : false}
                    onSave={(values) => onSave(editing.entry.id, values)}
                    onRemove={() => onRemove(editing.entry.id)}
                />
            )}
        </Card>
    )
}
