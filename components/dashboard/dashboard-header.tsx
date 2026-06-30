'use client'

import { usePathname } from 'next/navigation'

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Posts',
    '/dashboard/editor': 'Editor',
    '/dashboard/branding': 'Branding',
    '/dashboard/settings': 'Settings',
}

export function DashboardHeader() {
    const pathname = usePathname()
    const title = PAGE_TITLES[pathname] ?? 'Dashboard'

    return (
        <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
            <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
                <SidebarTrigger className='-ml-1' />
                <Separator orientation='vertical' className='mx-2 data-[orientation=vertical]:h-4' />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>{title}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </header>
    )
}
