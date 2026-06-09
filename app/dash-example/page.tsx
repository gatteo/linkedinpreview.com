import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/shadcn-demo/app-sidebar'
import { ChartAreaInteractive } from '@/components/shadcn-demo/chart-area-interactive'
import { DataTable } from '@/components/shadcn-demo/data-table'
import { SectionCards } from '@/components/shadcn-demo/section-cards'
import { SiteHeader } from '@/components/shadcn-demo/site-header'

import data from './data.json'

export default function Page() {
    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }>
            <AppSidebar variant='inset' />
            <SidebarInset>
                <SiteHeader />
                <div className='flex flex-1 flex-col'>
                    <div className='@container/main flex flex-1 flex-col gap-2'>
                        <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
                            <SectionCards />
                            <div className='px-4 lg:px-6'>
                                <ChartAreaInteractive />
                            </div>
                            <DataTable data={data} />
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
