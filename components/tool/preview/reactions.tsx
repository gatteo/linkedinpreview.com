import type React from 'react'
import Image from 'next/image'

export const Reactions: React.FC = () => {
    return (
        <div className='flex h-5 items-center'>
            <Image
                alt=''
                loading='lazy'
                width={24}
                height={24}
                className='h-5 w-auto shrink-0'
                src='/images/home/post-reactions.svg'
            />
        </div>
    )
}
