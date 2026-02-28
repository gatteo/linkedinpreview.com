/**
 * Inspired by https://jahir.dev/uses
 */

import Image from 'next/image'
import { UtmUrl } from '@/utils/urls'

import { UtmMediums } from '@/types/urls'

export type Items = Array<{
    image: string
    name: string
    description: string
    url: string
}>

type ItemGridProps = {
    items: Items
}

export const ItemGrid = (props: ItemGridProps) => {
    const { items } = props

    return (
        <div className='mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {items.map((item) => (
                <a
                    key={item.name}
                    href={UtmUrl(item.url, {
                        medium: UtmMediums.Blog,
                        content: 'item_grid',
                    })}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='bg-muted hover:bg-accent flex gap-6 rounded-lg border p-4 no-underline transition-colors duration-200 sm:flex-col sm:gap-3'>
                    <Image
                        src={item.image}
                        width={256}
                        height={256}
                        alt={item.name}
                        className='m-0 size-24 sm:size-full'
                    />
                    <div className='flex flex-col justify-center gap-2'>
                        <div className='text-lg font-extrabold'>{item.name}</div>
                        <div className='text-muted-foreground text-sm'>{item.description}</div>
                    </div>
                </a>
            ))}
        </div>
    )
}
