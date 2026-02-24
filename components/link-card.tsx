import Image from 'next/image'
import Link from 'next/link'
import { IconExternalLink } from '@tabler/icons-react'

import { Icon, Icons } from './icon'
import { Button } from './ui/button'

type Props = {
    title: string
    description: string
    icon?: keyof typeof Icons
    image?: string
    href: string
}

export function LinkCard({ title, description, icon, image, href }: Props) {
    return (
        <Link
            href={href}
            target='_blank'
            className='group relative flex flex-row space-x-4 rounded-xl border border-border bg-white p-5 shadow-subtle transition-all duration-200 hover:shadow-elevated'>
            {icon && <Icon name={icon} className='size-7 text-primary' />}

            {image && (
                <Image src={image} height={40} width={80} alt='Logo' className='mt-2 h-fit w-[80px] opacity-70' />
            )}

            <div className='flex-1 flex-row'>
                <h2 className='text-lg font-semibold text-neutral-900'>{title}</h2>
                <div className='mt-1.5 text-sm leading-relaxed text-neutral-500'>{description}</div>
                <Button variant='link' className='mt-3 p-0 text-primary' size='sm'>
                    Learn more
                </Button>
            </div>

            <IconExternalLink className='absolute right-4 top-5 size-4 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100' />
        </Link>
    )
}
