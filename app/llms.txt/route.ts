import { NextResponse } from 'next/server'
import { absoluteUrl } from '@/utils/urls'

import { site } from '@/config/site'
import { Routes } from '@/config/routes'
import { getAllBlogPosts } from '@/lib/blog'

export const GET = async () => {
    const allBlogPosts = await getAllBlogPosts()

    const content = `# ${site.title}

> ${site.description}

## About

LinkedIn Post Preview is a free online tool designed to help users create better LinkedIn content. The tool provides:

- **Real-time Preview**: See how your LinkedIn posts will appear on both desktop and mobile devices before publishing
- **Text Formatting**: Add bold, italic, underlined, and strikethrough text to your LinkedIn posts
- **List Support**: Create bullet point and numbered lists in your LinkedIn posts
- **Character Counter**: Track your post length to stay within LinkedIn's limits
- **Open Source**: The entire project is open source and available on GitHub

This tool helps LinkedIn users improve their content creation workflow by providing visual feedback and formatting capabilities that LinkedIn's native interface doesn't offer.

## Main Pages

- [Home](${absoluteUrl(Routes.Home)}): The main landing page with the LinkedIn post preview tool
- [Tool](${absoluteUrl(Routes.Tool)}): Interactive LinkedIn post editor and preview
- [Features](${absoluteUrl(Routes.AllFeatures)}): Complete list of all features and capabilities
- [How It Works](${absoluteUrl(Routes.HowItWorks)}): Step-by-step guide on using the tool
- [FAQs](${absoluteUrl(Routes.Faqs)}): Frequently asked questions about LinkedIn post formatting
- [Blog](${absoluteUrl(Routes.Blog)}): Tips and guides for writing better LinkedIn posts

## Blog Posts

${allBlogPosts
    .map((post) => {
        return `- [${post.title}](${absoluteUrl(post.url)}): ${post.summary}`
    })
    .join('\n')}

## Optional

The following resources provide additional context but can be skipped for brevity:

- [RSS Feed](${absoluteUrl('/rss.xml')}): Subscribe to blog updates via RSS
`

    return new NextResponse(content, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    })
}
