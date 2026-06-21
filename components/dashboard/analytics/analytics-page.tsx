'use client'

import * as React from 'react'
import { MotionConfig } from 'framer-motion'
import { ActivityIcon, LayersIcon, UploadIcon } from 'lucide-react'

import { publishedPosts, statusCounts } from '@/lib/analytics/aggregate'
import type { MetricValues } from '@/lib/analytics/metrics'
import { useDrafts } from '@/hooks/use-drafts'
import { usePostMetrics } from '@/hooks/use-post-metrics'
import { usePublishedContent } from '@/hooks/use-published-content'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/dashboard/page-header'

import { ActivitySection } from './activity-section'
import { AiInsightsSection } from './ai-insights-section'
import { AnalyticsEmpty } from './analytics-empty'
import { ContentDnaSection } from './content-dna-section'
import { ContentInsights } from './content-insights'
import { EngagementTrendChart } from './engagement-trend-chart'
import { GoldenHourCard } from './golden-hour-card'
import { ImportLinkedInButton } from './import-linkedin-button'
import { ImportMetricsDialog } from './import-metrics-dialog'
import { KpiCards } from './kpi-cards'
import { PostsPerformanceTable } from './posts-performance-table'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

function AnalyticsPageSkeleton() {
    return (
        <div className='flex-1 space-y-6 overflow-y-auto p-4 lg:p-6'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-32 rounded-xl' />
                ))}
            </div>
            <Skeleton className='h-40 rounded-xl' />
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
                <Skeleton className='h-72 rounded-xl lg:col-span-2' />
                <Skeleton className='h-72 rounded-xl' />
            </div>
        </div>
    )
}

export function AnalyticsPage() {
    const { drafts, isLoading: draftsLoading } = useDrafts()
    const { metrics, isLoading: metricsLoading, saveMetrics, saveManyMetrics, removeMetrics } = usePostMetrics()
    const { features, isLoading: contentLoading } = usePublishedContent()
    const [importOpen, setImportOpen] = React.useState(false)
    // Pin "now" once so period math stays stable across re-renders (and pure).
    const [now] = React.useState(() => Date.now())

    const isLoading = draftsLoading || metricsLoading || contentLoading

    const posts = React.useMemo(() => publishedPosts(drafts, metrics), [drafts, metrics])
    const funnel = React.useMemo(() => statusCounts(drafts), [drafts])

    const handleSave = React.useCallback(
        (draftId: string, values: MetricValues) => saveMetrics(draftId, values, 'manual'),
        [saveMetrics],
    )
    const handleImport = React.useCallback(
        (rows: { draftId: string; values: MetricValues }[]) => saveManyMetrics(rows, 'csv'),
        [saveManyMetrics],
    )

    const importDialog = (
        <ImportMetricsDialog open={importOpen} onOpenChange={setImportOpen} drafts={drafts} onImport={handleImport} />
    )

    if (isLoading) {
        return (
            <>
                <PageHeader title='Analytics' />
                <AnalyticsPageSkeleton />
            </>
        )
    }

    if (posts.length === 0) {
        return (
            <>
                <PageHeader title='Analytics' />
                <div className='flex flex-1 flex-col overflow-y-auto'>
                    <AnalyticsEmpty onImport={() => setImportOpen(true)} />
                </div>
                {importDialog}
            </>
        )
    }

    return (
        <>
            <PageHeader title='Analytics'>
                <ImportLinkedInButton variant='outline' />
                <Button variant='outline' size='sm' onClick={() => setImportOpen(true)}>
                    <UploadIcon className='mr-1.5 size-3.5' />
                    Import CSV
                </Button>
            </PageHeader>
            <MotionConfig reducedMotion='user'>
                <div className='flex-1 overflow-y-auto'>
                    <div className='space-y-8 p-4 lg:p-6'>
                        <Reveal>
                            <KpiCards posts={posts} now={now} />
                        </Reveal>

                        <Reveal index={1}>
                            <AiInsightsSection />
                        </Reveal>

                        <Reveal index={2}>
                            <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
                                <div className='lg:col-span-2'>
                                    <EngagementTrendChart posts={posts} now={now} />
                                </div>
                                <GoldenHourCard posts={posts} />
                            </div>
                        </Reveal>

                        <Reveal index={3}>
                            <ContentDnaSection posts={posts} features={features} />
                        </Reveal>

                        <Reveal index={4}>
                            <section className='space-y-4'>
                                <SectionHeading
                                    icon={ActivityIcon}
                                    title='Activity'
                                    subtitle='Your publishing cadence and pipeline'
                                />
                                <ActivitySection posts={posts} funnel={funnel} />
                            </section>
                        </Reveal>

                        <Reveal index={5}>
                            <section className='space-y-4'>
                                <SectionHeading
                                    icon={LayersIcon}
                                    title='Content insights'
                                    subtitle='How formats, length, and timing compare'
                                />
                                <ContentInsights posts={posts} />
                            </section>
                        </Reveal>

                        <Reveal index={6}>
                            <PostsPerformanceTable posts={posts} onSave={handleSave} onRemove={removeMetrics} />
                        </Reveal>
                    </div>
                </div>
            </MotionConfig>
            {importDialog}
        </>
    )
}
