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
            className='group relative flex flex-row space-x-4 rounded-md border bg-muted p-4 transition-all duration-150 hover:bg-accent'>
            {icon && <Icon name={icon} className='size-7' />}

            {image && (
                <Image src={image} height={40} width={80} alt='Logo' className='mt-2 h-fit w-[80px] opacity-70' />
            )}

            <div className='flex-1 flex-row'>
                <h2 className='text-xl font-bold'>{title}</h2>
                <div className='mt-2 text-sm leading-tight text-muted-foreground md:text-base'>{description}</div>
                <Button variant='link' className='mt-3 p-0' size='sm'>
                    scopri di più
                </Button>
            </div>

            <IconExternalLink className='absolute right-4 text-accent-foreground opacity-0 transition-opacity group-hover:opacity-100' />
        </Link>
    )
}
