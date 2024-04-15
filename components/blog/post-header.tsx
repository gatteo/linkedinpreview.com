import Image from 'next/image'
import { formatDate } from '@/utils/dates'
import { absoluteUrl } from '@/utils/urls'

import { BlogPostAuthor, BlogPostSource } from '@/types/blog'
import { Routes } from '@/config/routes'

import { AspectRatio } from '../ui/aspect-ratio'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { ShareIcons } from './share-icons'

type Props = {
    title: string
    slug: string
    createdAt: string | Date
    image: string | null
    summary: string
    source: BlogPostSource
    author: BlogPostAuthor
    tags: string[]
}

export function Header({ createdAt, title, slug, summary, image, author, tags }: Props) {
    return (
        <>
            <div>
                <h1 className='text-balance font-heading text-3xl font-bold md:text-center md:text-5xl'>{title}</h1>
                <div className='mt-4 text-balance text-muted-foreground md:text-center'>{summary}</div>
                <div className='mt-16 flex flex-col justify-between gap-8 md:flex-row md:items-center'>
                    <div className='flex flex-wrap items-center gap-2 text-xs sm:text-sm'>
                        <div className='flex flex-row items-center gap-2'>
                            <Avatar className='size-6'>
                                <AvatarImage src={author.image} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <p>{author.name}</p>
                        </div>

                        <div className='text-muted-foreground'>•</div>

                        <p>{formatDate(createdAt)}</p>

                        {tags.length > 0 && (
                            <>
                                <div className='text-muted-foreground'>•</div>
                                <div className='flex flex-wrap gap-1'>
                                    {tags.map((t) => (
                                        <Badge key={t} variant={'outline'}>
                                            {t}
                                        </Badge>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <ShareIcons title={title} url={absoluteUrl(Routes.BlogPost(slug))} className='justify-start' />
                </div>
            </div>

            {image && (
                <div className='my-6'>
                    <AspectRatio ratio={16 / 9} className='overflow-hidden rounded-lg shadow-2xl'>
                        <Image src={image} alt={title} fill className='object-cover' />
                    </AspectRatio>
                </div>
            )}
        </>
    )
}
