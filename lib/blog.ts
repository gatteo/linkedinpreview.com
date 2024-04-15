import { allBlogPosts } from 'contentlayer/generated'
import { remark } from 'remark'

import { BlogPostPreview, BlogPostSource, LocalBlogPost, TOC } from '@/types/blog'
import { Routes } from '@/config/routes'

import { remarkHeading } from './mdx/plugins/remark/remark-heading'

type Options = {
    limit?: number
}

export function getLocalBlogPost(slug: string): LocalBlogPost | undefined {
    return allBlogPosts.find((p) => p.slug === slug)
}

export function getLocalBlogPosts({ limit }: Options = {}): BlogPostPreview[] {
    return allBlogPosts
        .sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)))
        .slice(0, limit)
        .map((post) => ({
            id: post._id,
            slug: post.slug,
            title: post.title,
            summary: post.summary,
            date: new Date(post.createdAt),
            image: post.image,
            source: BlogPostSource.Local,
            url: Routes.BlogPost(post.slug),
            tags: post.tags,
            author: post.author,
        }))
}

export async function getAllBlogPosts(limit?: number): Promise<BlogPostPreview[]> {
    const localPosts = getLocalBlogPosts()

    const sortedLocalPosts = localPosts.sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)))

    return [...sortedLocalPosts].slice(0, limit)
}

export const getTOC = async (content: string) => {
    const result = await remark().use(remarkHeading).process(content)

    if ('toc' in result.data) {
        return result.data.toc as TOC[]
    }

    return []
}
