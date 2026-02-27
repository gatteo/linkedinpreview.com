import Image from 'next/image'
import { UtmUrl } from '@/utils/urls'
import { IconExternalLink } from '@tabler/icons-react'

import { UtmMediums } from '@/types/urls'

type LinkCardProps = {
    href: string
    hostname: string
    title: string
}

export const LinkCard = (props: LinkCardProps) => {
    const { href, hostname, title } = props

    return (
        <div className='not-prose flex justify-center'>
            <a
                href={UtmUrl(href, {
                    medium: UtmMediums.Blog,
                    content: 'link_card',
                })}
                className='my-8 flex items-center justify-center gap-4 rounded-lg border p-4'
                rel='noopener noreferrer'
                target='_blank'>
                <Image
                    src={`/images/website-icons/${hostname}.png`}
                    className='rounded-lg'
                    width={48}
                    height={48}
                    alt={hostname}
                />
                <div>
                    <div>{title}</div>
                    <div className='text-muted-foreground text-sm'>{href}</div>
                </div>
                <IconExternalLink size={22} data-testid='external-link-icon' />
            </a>
        </div>
    )
}
