import type { Metadata } from 'next'

import { PageHeader } from '@/components/dashboard/page-header'
import { SettingsForm } from '@/components/dashboard/settings-form'

export const metadata: Metadata = { title: 'Settings - LinkedInPreview.com' }

export default function SettingsPage() {
    return (
        <>
            <PageHeader title='Settings' />
            <div className='flex-1 overflow-y-auto'>
                <SettingsForm />
            </div>
        </>
    )
}
