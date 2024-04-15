import { NextResponse } from 'next/server'
import { absoluteUrl } from '@/utils/urls'
import RSS from 'rss'

import { site } from '@/config/site'
import { getAllBlogPosts } from '@/lib/blog'

export const GET = async () => {
    const feed = new RSS({
        title: "Matteo Giardino's Blog",
        description: "Matteo Giardino's personal website and blog",
        site_url: `${site.url}`,
        feed_url: `${site.url}/feed.xml`,
        language: 'it-IT',
        image_url: `${site.url}/images/og/og.png`,
    })

    const allBlogPosts = await getAllBlogPosts()

    const allPosts = allBlogPosts.sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)))

    allPosts.map(({ title, summary, date, url, author }) => {
        feed.item({
            title: title,
            url: absoluteUrl(url),
            date: date,
            description: summary,
            author: author.name,
        })
    })

    return new NextResponse(feed.xml({ indent: true }), {
        headers: {
            'Content-Type': 'application/xml',
        },
    })
}
