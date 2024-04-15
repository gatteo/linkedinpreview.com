import { absoluteUrl } from '@/utils/urls'
import { allPages } from 'contentlayer/generated'

import { Routes } from '@/config/routes'
import { getAllBlogPosts } from '@/lib/blog'

const sitemap = async () => {
    const blogPages = (await getAllBlogPosts()).map((post) => post.url)

    const cmsPages = allPages.map((page) => `/${page.slug}`)

    const routes = [Routes.Home, Routes.Blog, ...blogPages, ...cmsPages].map((route) => ({
        url: absoluteUrl(route),
        lastModified: new Date().toISOString().split('T')[0],
    }))

    return routes
}

export default sitemap
