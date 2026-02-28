import { LocalBlogPost } from '@/types/blog'
import { getLocalBlogPosts } from '@/lib/blog'

import { PostCard } from './post-card'

type Props = {
    currentPost: LocalBlogPost
    limit?: number
}

export function RelatedArticles({ currentPost, limit = 3 }: Props) {
    const allPosts = getLocalBlogPosts()

    // Filter out current post and find related posts by tags
    const relatedPosts = allPosts
        .filter((post) => post.slug !== currentPost.slug)
        .map((post) => {
            // Calculate similarity score based on shared tags
            const currentTags = currentPost.tags || []
            const postTags = post.tags || []
            const sharedTags = currentTags.filter((tag) => postTags.includes(tag)).length
            return {
                post,
                score: sharedTags,
            }
        })
        .filter((item) => item.score > 0) // Only include posts with at least one shared tag
        .sort((a, b) => b.score - a.score) // Sort by similarity score
        .slice(0, limit)
        .map((item) => item.post)

    // If we don't have enough related posts by tags, fill with recent posts
    if (relatedPosts.length < limit) {
        const recentPosts = allPosts
            .filter((post) => post.slug !== currentPost.slug && !relatedPosts.some((rp) => rp.slug === post.slug))
            .slice(0, limit - relatedPosts.length)
        relatedPosts.push(...recentPosts)
    }

    if (relatedPosts.length === 0) {
        return null
    }

    return (
        <div className='border-border mt-16 border-t pt-8'>
            <h2 className='font-heading mb-8 text-2xl font-bold tracking-tight text-neutral-900'>Related articles</h2>
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {relatedPosts.map((post) => (
                    <PostCard key={post.slug} post={post} />
                ))}
            </div>
        </div>
    )
}
