import { absoluteUrl } from '@/utils/urls'
import { allPages } from 'contentlayer/generated'

import { Routes } from '@/config/routes'
import { getAllBlogPosts } from '@/lib/blog'

const sitemap = async () => {
    const allBlogPosts = await getAllBlogPosts()

    const cmsPages = allPages.map((page) => `/${page.slug}`)

    // Static pages (without images)
    const staticPages = [Routes.Home, Routes.Blog, ...cmsPages].map((route) => ({
        url: absoluteUrl(route),
        lastModified: new Date().toISOString().split('T')[0],
    }))

    // Blog posts with images
    const blogPages = allBlogPosts.map((post) => ({
        url: absoluteUrl(post.url),
        lastModified: new Date(post.date).toISOString().split('T')[0],
        images: post.image ? [absoluteUrl(post.image)] : undefined,
    }))

    return [...staticPages, ...blogPages]
}

export default sitemap
