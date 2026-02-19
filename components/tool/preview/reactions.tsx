import type React from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

import { useScreenSize } from './preview-size-context'

export const Reactions: React.FC = () => {
    const { screenSize } = useScreenSize()

    return (
        <div className='flex items-center justify-between'>
            <div className='flex items-center justify-start gap-2'>
                <Image
                    alt='post reactions'
                    loading='lazy'
                    width={24}
                    height={24}
                    className='h-5 w-auto'
                    src='/images/home/post-reactions.svg'
                />
                <span className={cn('mt-1 font-medium text-gray-500', screenSize === 'mobile' ? 'hidden' : 'text-xs')}>
                    John Doe and 169 others
                </span>
            </div>
            <div className='flex items-center justify-end gap-2'>
                {['4 comments', '•', '1 repost'].map((text) => (
                    <span
                        key={text}
                        className={cn(
                            'font-medium text-gray-500',
                            screenSize === 'mobile' ? 'text-[10px]' : 'text-xs',
                        )}>
                        {text}
                    </span>
                ))}
            </div>
        </div>
    )
}
