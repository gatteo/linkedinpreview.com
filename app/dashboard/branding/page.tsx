import type { Metadata } from 'next'

import { BrandingForm } from '@/components/dashboard/branding/branding-form'
import { PageHeader } from '@/components/dashboard/page-header'

export const metadata: Metadata = { title: 'Branding - LinkedInPreview.com' }

export default function BrandingPage() {
    return (
        <>
            <PageHeader title='Branding' />
            <div className='flex-1 overflow-y-auto'>
                <BrandingForm />
            </div>
        </>
    )
}
