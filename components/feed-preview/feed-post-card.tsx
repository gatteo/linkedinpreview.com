'use client'

import type React from 'react'

import { PostCard } from '@/components/tool/preview/post-card'
import { ScreenSizeProvider } from '@/components/tool/preview/preview-size-context'
import type { Media } from '@/components/tool/tool'

interface FeedPostCardProps {
    content: any
    media?: Media | null
}

export const FeedPostCard: React.FC<FeedPostCardProps> = ({ content, media = null }) => {
    return (
        <ScreenSizeProvider>
            <PostCard content={content} media={media} className='ring-primary/20 ring-2' />
        </ScreenSizeProvider>
    )
}
