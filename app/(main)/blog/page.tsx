import type { Metadata, ResolvingMetadata } from 'next'
import { absoluteUrl } from '@/utils/urls'

import { Routes } from '@/config/routes'
import { getAllBlogPosts } from '@/lib/blog'
import { FilteredPosts } from '@/components/blog/filtered-posts'
import { Hero } from '@/components/blog/hero'

const title = 'LinkedIn Post Tips & Guides'
const description =
    'Expert tips and guides for creating engaging LinkedIn posts. Learn formatting techniques, best practices, and strategies to boost your LinkedIn presence and grow your professional network.'

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
            <FilteredPosts posts={posts} initialSearch={q} />
        </main>
    )
}
