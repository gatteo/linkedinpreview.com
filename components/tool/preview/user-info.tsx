import type React from 'react'
import Image from 'next/image'

import { Icon } from '@/components/icon'

export type PreviewAuthor = {
    name?: string
    headline?: string
    avatarUrl?: string | null
}

type UserInfoProps = {
    author?: PreviewAuthor
}

const FALLBACK_NAME = 'Matteo Giardino'
const FALLBACK_HEADLINE = 'Founder @ devv.it'
const FALLBACK_AVATAR =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4Ij4KICA8cGF0aCBmaWxsPSIjZTdlMmRjIiBkPSJNMCAwaDEyOHYxMjhIMHoiLz4KICA8cGF0aCBkPSJNODguNDEgODQuNjdhMzIgMzIgMCAxMC00OC44MiAwIDY2LjEzIDY2LjEzIDAgMDE0OC44MiAweiIgZmlsbD0iIzc4OGZhNSIvPgogIDxwYXRoIGQ9Ik04OC40MSA4NC42N2EzMiAzMiAwIDAxLTQ4LjgyIDBBNjYuNzkgNjYuNzkgMCAwMDAgMTI4aDEyOGE2Ni43OSA2Ni43OSAwIDAwLTM5LjU5LTQzLjMzeiIgZmlsbD0iIzlkYjNjOCIvPgogIDxwYXRoIGQ9Ik02NCA5NmEzMS45MyAzMS45MyAwIDAwMjQuNDEtMTEuMzMgNjYuMTMgNjYuMTMgMCAwMC00OC44MiAwQTMxLjkzIDMxLjkzIDAgMDA2NCA5NnoiIGZpbGw9IiM1NjY4N2EiLz4KPC9zdmc+Cg=='

export const UserInfo: React.FC<UserInfoProps> = ({ author }) => {
    const name = author?.name?.trim() || FALLBACK_NAME
    const headline = author?.headline?.trim() || FALLBACK_HEADLINE
    const avatarUrl = author?.avatarUrl?.trim() || FALLBACK_AVATAR

    return (
        <div className='flex items-center gap-3'>
            <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-3'>
                    <span className='relative inline-block shrink-0'>
                        <Image
                            alt=''
                            loading='lazy'
                            width={140}
                            height={140}
                            className='size-12 rounded-full object-cover'
                            src={avatarUrl}
                        />
                        <span className='absolute right-0 bottom-0 inline-flex size-4 items-center justify-center rounded-full bg-[#1052B8] text-white ring-2 ring-white'>
                            <Icon name='linkedinLogo' className='size-2.5' />
                        </span>
                    </span>
                    <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-semibold text-neutral-900'>{name}</p>
                        <p className='truncate text-xs font-normal text-neutral-500'>{headline}</p>
                        <div className='flex items-center gap-1'>
                            <span className='text-xs font-normal text-neutral-500'>Now</span>
                            <span className='text-xs font-normal text-neutral-500'>•</span>
                            <Icon name='linkedInVisibility' className='size-3.5 text-neutral-500' />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
