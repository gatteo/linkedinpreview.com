import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { absoluteUrl } from '@/utils/urls'
import { type Article, type BreadcrumbList, type WithContext } from 'schema-dts'

import { BlogPostSource } from '@/types/blog'
import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { getLocalBlogPost, getLocalBlogPosts } from '@/lib/blog'
import { generateHowToSchema } from '@/lib/schema'
import { Footer } from '@/components/blog/post-footer'
import { Header } from '@/components/blog/post-header'
import { RelatedArticles } from '@/components/blog/related-articles'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ArticleHelpfulness } from '@/components/feedback/article-helpfulness'
import { Content } from '@/components/mdx-content'
import { ScrollIndicator } from '@/components/scroll-indicator'

type Props = {
    params: Promise<{
        slug: string
    }>
}

export function generateStaticParams() {
    const posts = getLocalBlogPosts()
    return posts.map((post) => ({
        slug: post.slug,
    }))
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
    const { slug } = await params
    const previousOpenGraph = (await parent)?.openGraph ?? {}
    const previousTwitter = (await parent)?.twitter ?? {}

    const post = getLocalBlogPost(slug)
    if (!post) return {}

    const ISOPublishedTime = new Date(post.createdAt).toISOString()
    const ISOModifiedTime = new Date(post.modifiedAt).toISOString()

    return {
        title: post.title,
        description: post.summary,
        alternates: {
            canonical: absoluteUrl(Routes.BlogPost(slug)),
        },
        openGraph: {
            ...previousOpenGraph,
            url: absoluteUrl(Routes.BlogPost(slug)),
            type: 'article',
            title: post.title,
            siteName: site.title,
            description: post.summary,
            locale: 'it-IT',
            publishedTime: ISOPublishedTime,
            modifiedTime: ISOModifiedTime,
            authors: site.url,
            images: [
                {
                    url: `${site.url}/images/blog/${post.slug}/og.png`,
                    width: 1200,
                    height: 630,
                    alt: post.summary,
                    type: 'image/png',
                },
            ],
        },
        twitter: {
            ...previousTwitter,
            title: post.title,
            description: post.summary,
            images: [
                {
                    url: `${site.url}/images/blog/${post.slug}/og.png`,
                    alt: post.summary,
                    width: 1200,
                    height: 630,
                },
            ],
        },
    }
}

export default async function Page({ params }: Props) {
    const { slug } = await params
    const post = getLocalBlogPost(slug)

    if (!post) {
        notFound()
    }

    const jsonLd: WithContext<Article> = {
        '@context': 'https://schema.org',
        '@type': 'Article',

        'headline': post.title,
        'description': post.summary,
        'datePublished': post.createdAt,
        'dateModified': post.modifiedAt,
        'image': `${site.url}/images/blog/${post.slug}/og.png`,
        'author': {
            '@type': 'Person',
            'name': post.author.name,
            'url': post.author.url,
        },
        'publisher': {
            '@id': `${site.url}/#organization`,
        },
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': absoluteUrl(Routes.BlogPost(slug)),
        },
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
                'name': 'Blog',
                'item': absoluteUrl(Routes.Blog),
            },
            {
                '@type': 'ListItem',
                'position': 3,
                'name': post.title,
                'item': absoluteUrl(Routes.BlogPost(slug)),
            },
        ],
    }

    // Generate HowTo schema for tutorial posts
    const howToSchema = generateHowToSchema(post)

    return (
        <main className='mx-auto max-w-content px-6 pb-16'>
            <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            {howToSchema && (
                <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            )}

            <Breadcrumbs
                items={[
                    { label: 'Home', href: '/' },
                    { label: 'Blog', href: Routes.Blog },
                    { label: post.title, href: Routes.BlogPost(slug) },
                ]}
            />

            <Header
                createdAt={post.createdAt}
                title={post.title}
                slug={post.slug}
                summary={post.summary}
                image={post.image}
                author={post.author}
                source={BlogPostSource.Local}
                tags={post.tags}
            />

            <Content title={post.title} body={post.body} url={absoluteUrl(Routes.BlogPost(slug))} />

            <Footer slug={slug} title={post.title} author={post.author} source={BlogPostSource.Local} />

            <ArticleHelpfulness slug={slug} title={post.title} />

            <RelatedArticles currentPost={post} />

            <ScrollIndicator />
        </main>
    )
}
