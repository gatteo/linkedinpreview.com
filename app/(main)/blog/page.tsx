import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { absoluteUrl } from '@/utils/urls'

import { Routes } from '@/config/routes'
import { getAllBlogPosts } from '@/lib/blog'
import { FilteredPosts } from '@/components/blog/filtered-posts'
import { Hero } from '@/components/blog/hero'

const title = 'LinkedIn Post Tips & Guides to Boost Your Reach (2026)'
const description =
    'Browse expert LinkedIn guides on post formatting, hooks, hashtags, and content strategy. Actionable tips to boost engagement and grow your audience in 2026.'

type Props = {
    params: Record<string, never>
    searchParams: Promise<{ q?: string }>
}

export async function generateMetadata(_: Props, parent: ResolvingMetadata): Promise<Metadata> {
    const previousOpenGraph = (await parent)?.openGraph ?? {}
    const previousTwitter = (await parent)?.twitter ?? {}

    return {
        title,
        description,
        alternates: {
            canonical: absoluteUrl(Routes.Blog),
        },
        openGraph: {
            ...previousOpenGraph,
            url: absoluteUrl(Routes.Blog),
            title,
            description,
        },
        twitter: {
            ...previousTwitter,
            title,
            description,
        },
    }
}

export default async function Page({ searchParams }: Props) {
    const posts = await getAllBlogPosts()
    const { q } = await searchParams

    return (
        <main>
            <Hero />
            <Suspense>
                <FilteredPosts posts={posts} initialSearch={q} />
            </Suspense>
        </main>
    )
}
