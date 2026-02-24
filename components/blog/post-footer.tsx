'use client'

import { absoluteUrl } from '@/utils/urls'

import { BlogPostAuthor, BlogPostSource } from '@/types/blog'
import { Routes } from '@/config/routes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { ShareIcons } from './share-icons'

type Props = {
    slug: string
    title: string
    source: BlogPostSource
    author: BlogPostAuthor
}

export function Footer({ slug, title, author }: Props) {
    return (
        <div>
            <div className='mt-10 flex w-full flex-col items-center gap-4 border-t border-border pt-4 md:flex-row md:justify-between'>
                <div className='flex flex-row items-center gap-2'>
                    <Avatar className='size-6'>
                        <AvatarImage src={author.image} />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div>{author.name}</div>
                </div>
                <ShareIcons title={title} url={absoluteUrl(Routes.BlogPost(slug))} />
            </div>
        </div>
    )
}
