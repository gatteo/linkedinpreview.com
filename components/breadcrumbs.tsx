import Link from 'next/link'
import { IconChevronRight } from '@tabler/icons-react'

export type BreadcrumbItem = {
    label: string
    href: string
}

type BreadcrumbsProps = {
    items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav aria-label='Breadcrumb' className='my-6'>
            <ol className='text-muted-foreground flex items-center space-x-2 text-sm'>
                {items.map((item, index) => (
                    <li key={item.href} className='flex items-center'>
                        {index > 0 && <IconChevronRight className='mx-1 size-4' />}
                        {index === items.length - 1 ? (
                            <span className='text-foreground font-medium'>{item.label}</span>
                        ) : (
                            <Link href={item.href} className='hover:text-foreground transition-colors'>
                                {item.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    )
}
