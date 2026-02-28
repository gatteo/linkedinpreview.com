import { absoluteUrl } from '@/utils/urls'
import { allPages } from 'contentlayer/generated'

import { Routes } from '@/config/routes'
import { getAllBlogPosts } from '@/lib/blog'
import { getAllComparisons } from '@/lib/compare'

const sitemap = async () => {
    const allBlogPosts = await getAllBlogPosts()
    const allComparisons = getAllComparisons()

    const cmsPages = allPages.map((page) => `/${page.slug}`)

    // Static pages (without images)
    const staticPages = [Routes.Home, Routes.Blog, Routes.Compare, ...cmsPages].map((route) => ({
        url: absoluteUrl(route),
        lastModified: new Date().toISOString().split('T')[0],
    }))

    // Blog posts with images
    const blogPages = allBlogPosts.map((post) => ({
        url: absoluteUrl(post.url),
        lastModified: new Date(post.date).toISOString().split('T')[0],
        images: post.image ? [absoluteUrl(post.image)] : undefined,
    }))

    // Comparison pages
    const comparePages = allComparisons.map((comparison) => ({
        url: absoluteUrl(comparison.url),
        lastModified: new Date(comparison.modifiedAt).toISOString().split('T')[0],
    }))

    return [...staticPages, ...blogPages, ...comparePages]
}

export default sitemap
