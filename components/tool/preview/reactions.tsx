import type React from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

import { useScreenSize } from './preview-size-context'

export type PostSocialCounts = {
    others?: number
    comments?: number
    reposts?: number
}

export const Reactions: React.FC<{ social?: PostSocialCounts }> = ({ social }) => {
    const { screenSize } = useScreenSize()
    const others = social?.others ?? 169
    const comments = social?.comments ?? 4
    const reposts = social?.reposts ?? 1

    return (
        // `screenSize` is the simulated device, not the real viewport: a narrow phone can be
        // showing the desktop preview. Every label is nowrap so the row degrades by truncating
        // the left caption instead of folding both groups into ragged columns.
        <div className='flex items-center justify-between gap-2'>
            <div className='flex min-w-0 items-center justify-start gap-2'>
                <Image
                    alt='post reactions'
                    loading='lazy'
                    width={24}
                    height={24}
                    className='h-5 w-auto shrink-0'
                    src='/images/home/post-reactions.svg'
                />
                <span
                    className={cn(
                        'truncate font-normal whitespace-nowrap text-[#666]',
                        screenSize === 'mobile' ? 'hidden' : 'text-xs',
                    )}>
                    John Doe and {others} others
                </span>
            </div>
            <div className='flex shrink-0 items-center justify-end gap-2'>
                {[`${comments} comments`, '•', `${reposts} repost${reposts === 1 ? '' : 's'}`].map((text) => (
                    <span
                        key={text}
                        className={cn(
                            'font-normal whitespace-nowrap text-[#666]',
                            screenSize === 'mobile' ? 'text-[10px]' : 'text-xs',
                        )}>
                        {text}
                    </span>
                ))}
            </div>
        </div>
    )
}
