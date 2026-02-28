import type React from 'react'

import { cn } from '@/lib/utils'

import type { Media } from '../tool'
import { ActionButtons } from './action-buttons'
import { ContentSection } from './content-section'
import { Reactions } from './reactions'
import { UserInfo } from './user-info'

interface PostCardProps {
    content: any
    media: Media | null
    className?: string
}

export const PostCard: React.FC<PostCardProps> = ({ content, media, className }) => {
    return (
        <div
            className={cn(
                'font-system overflow-hidden rounded-lg border border-black/8 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]',
                className,
            )}>
            <div className='pt-3 pr-4 pb-1 pl-4'>
                <UserInfo />
                <ContentSection content={content} />
            </div>
            {media && (
                <div className='relative w-full'>
                    {media.type === 'video' ? (
                        <video
                            src={media.src}
                            controls
                            playsInline
                            loop
                            className='w-full'
                            style={{ maxHeight: '600px' }}
                        />
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={media.src}
                            alt='Post'
                            className='w-full object-cover'
                            style={{ maxHeight: '600px', objectFit: 'contain' }}
                        />
                    )}
                </div>
            )}
            <div className='py-2 pr-4 pl-4'>
                <Reactions />
                <hr className='mt-3 border-neutral-200' />
                <ActionButtons />
            </div>
        </div>
    )
}
