'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/utils/dates'
import { UtmUrl } from '@/utils/urls'
import posthog from 'posthog-js'

import { BlogPostPreview } from '@/types/blog'

import { Badge } from '../ui/badge'

export function PostCard({ post }: { post: BlogPostPreview }) {
    const handleClick = () => {
        posthog.capture('blog_article_clicked', {
            article_slug: post.slug,
            article_title: post.title,
            article_tags: post.tags,
        })
    }

    return (
        <Link
            key={post.id}
            href={UtmUrl(post.url, {
                content: 'post_card',
            })}
            onClick={handleClick}
            className='group flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated'>
            <Image
                src={post.image ?? '/images/blog-post-placeholder.png'}
                width={1280}
                height={720}
                alt={post.title}
                className='aspect-video object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]'
            />

            <div className='flex flex-1 flex-col p-5'>
                <h2 className='mb-2 text-lg font-semibold text-neutral-900 transition-colors group-hover:text-primary'>
                    {post.title}
                </h2>
                <p className='mb-4 flex-1 text-sm leading-relaxed text-neutral-500'>
                    {post.summary.slice(0, 120)}
                    {post.summary.length > 120 && '...'}
                </p>

                <div className='flex flex-wrap items-center gap-2 text-xs text-neutral-400'>
                    <span>{formatDate(post.date)}</span>
                    {post.tags && post.tags.length > 0 && (
                        <>
                            <span>·</span>
                            {post.tags.map((t) => (
                                <Badge
                                    key={t}
                                    variant='outline'
                                    className='border-border text-xs font-normal text-neutral-500'>
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
