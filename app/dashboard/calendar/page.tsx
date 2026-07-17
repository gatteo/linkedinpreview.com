import type { Metadata } from 'next'

import { ContentCalendar } from '@/components/dashboard/calendar/content-calendar'
import { PageHeader } from '@/components/dashboard/page-header'

export const metadata: Metadata = { title: 'Content Calendar - LinkedInPreview.com' }

export default function CalendarPage() {
    return (
        <>
            <PageHeader title='Content Calendar' />
            <div className='flex-1 overflow-y-auto'>
                <ContentCalendar />
            </div>
        </>
    )
}
