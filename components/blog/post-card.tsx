'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/utils/dates'
import { UtmUrl } from '@/utils/urls'
import posthog from 'posthog-js'

import { BlogPostPreview } from '@/types/blog'
import { Badge } from '@/components/ui/badge'

export function PostCard({ post }: { post: BlogPostPreview }) {
    const handleClick = () => {
        posthog?.capture('blog_article_clicked', {
            article_slug: post.slug,
            article_title: post.title,
            article_tags: post.tags,
        })
    }

    return (
        <Link
            href={UtmUrl(post.url, {
                content: 'post_card',
            })}
            onClick={handleClick}
            className='group border-border shadow-subtle hover:shadow-elevated bg-card flex flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5'>
            <Image
                src={post.image ?? '/images/blog-post-placeholder.png'}
                width={1280}
                height={720}
                alt={post.title}
                className='aspect-video object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]'
            />

            <div className='flex flex-1 flex-col p-5'>
                <h2 className='group-hover:text-primary font-heading text-foreground mb-2 text-lg font-semibold transition-colors'>
                    {post.title}
                </h2>
                <p className='text-muted-foreground mb-4 flex-1 text-sm leading-relaxed'>
                    {post.summary.slice(0, 120)}
                    {post.summary.length > 120 && '...'}
                </p>

                <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-xs'>
                    <span>{formatDate(post.date)}</span>
                    {post.tags && post.tags.length > 0 && (
                        <>
                            <span>·</span>
                            {post.tags.map((t) => (
                                <Badge
                                    key={t}
                                    variant='outline'
                                    className='border-border text-muted-foreground text-xs font-normal'>
                                    {t}
                                </Badge>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </Link>
    )
}
