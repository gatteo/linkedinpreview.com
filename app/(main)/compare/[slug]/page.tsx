import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { absoluteUrl } from '@/utils/urls'
import { type BreadcrumbList, type WithContext } from 'schema-dts'

import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { getAllComparisons, getComparison } from '@/lib/compare'
import { Breadcrumbs } from '@/components/breadcrumbs'
import Mdx from '@/components/mdx/mdx'

type Props = {
    params: Promise<{
        slug: string
    }>
}

export function generateStaticParams() {
    const comparisons = getAllComparisons()
    return comparisons.map((c) => ({
        slug: c.slug,
    }))
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
    const { slug } = await params
    const previousOpenGraph = (await parent)?.openGraph ?? {}
    const previousTwitter = (await parent)?.twitter ?? {}

    const comparison = getComparison(slug)
    if (!comparison) return {}

    const ISOPublishedTime = new Date(comparison.createdAt).toISOString()
    const ISOModifiedTime = new Date(comparison.modifiedAt).toISOString()

    return {
        title: comparison.title,
        description: comparison.summary,
        alternates: {
            canonical: absoluteUrl(Routes.ComparePost(slug)),
        },
        openGraph: {
            ...previousOpenGraph,
            url: absoluteUrl(Routes.ComparePost(slug)),
            type: 'article',
            title: comparison.title,
            siteName: site.title,
            description: comparison.summary,
            locale: 'en-US',
            publishedTime: ISOPublishedTime,
            modifiedTime: ISOModifiedTime,
        },
        twitter: {
            ...previousTwitter,
            title: comparison.title,
            description: comparison.summary,
        },
    }
}

export default async function Page({ params }: Props) {
    const { slug } = await params
    const comparison = getComparison(slug)

    if (!comparison) {
        notFound()
    }

    const breadcrumbSchema: WithContext<BreadcrumbList> = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': site.url,
            },
            {
                '@type': 'ListItem',
                'position': 2,
                'name': 'Compare',
                'item': absoluteUrl(Routes.Compare),
            },
            {
                '@type': 'ListItem',
                'position': 3,
                'name': comparison.title,
                'item': absoluteUrl(Routes.ComparePost(slug)),
            },
        ],
    }

    return (
        <main className='max-w-content mx-auto px-6 pb-16'>
            <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            <Breadcrumbs
                items={[
                    { label: 'Home', href: '/' },
                    { label: 'Compare', href: Routes.Compare },
                    { label: `LinkedIn Preview vs ${comparison.competitor}`, href: Routes.ComparePost(slug) },
                ]}
            />

            {/* Page header */}
            <header className='mt-4 mb-10'>
                <div className='mb-3 flex items-center gap-2'>
                    <span className='border-border text-primary shadow-subtle inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-medium'>
                        Comparison
                    </span>
                </div>
                <h1 className='font-heading mb-4 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl'>
                    {comparison.title}
                </h1>
                <p className='max-w-2xl text-lg leading-7 text-neutral-500'>{comparison.summary}</p>
            </header>

            {/* MDX content */}
            <article className='w-full lg:max-w-[670px]'>
                <Mdx code={comparison.body.code} />
            </article>
        </main>
    )
}
