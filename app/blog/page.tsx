import type { Metadata, ResolvingMetadata } from 'next'
import { absoluteUrl } from '@/utils/urls'

import { Routes } from '@/config/routes'
import { getAllBlogPosts } from '@/lib/blog'
import { FilteredPosts } from '@/components/blog/filtered-posts'
import { Hero } from '@/components/blog/hero'

const title = 'articoli'
const description =
    'un remoto angolo del web che posso riempire di articoli, storie e guide. Tanto chi legge i blog nel 2024?'

type Props = {
    params: Record<string, never>
    searchParams: Record<string, never>
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

export default async function Page() {
    const posts = await getAllBlogPosts()

    return (
        <main>
            <Hero />
            <FilteredPosts posts={posts} />
        </main>
    )
}
