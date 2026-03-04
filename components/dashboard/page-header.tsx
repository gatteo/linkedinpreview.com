'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'

type PageHeaderProps = {
    title: string
    children?: React.ReactNode
}

export function PageHeader({ title, children }: PageHeaderProps) {
    return (
        <header className='bg-background flex h-14 shrink-0 items-center justify-between border-b px-4 lg:px-6'>
            <div className='flex items-center gap-2'>
                <SidebarTrigger className='-ml-1 lg:hidden' />
                <h1 className='text-lg font-semibold'>{title}</h1>
            </div>
            {children && <div className='flex items-center gap-2'>{children}</div>}
        </header>
    )
}
