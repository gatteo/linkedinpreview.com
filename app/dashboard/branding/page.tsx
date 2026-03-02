import type { Metadata } from 'next'

import { BrandingForm } from '@/components/dashboard/branding-form'

export const metadata: Metadata = {
    title: 'Branding - LinkedInPreview.com',
}

export default function BrandingPage() {
    return <BrandingForm />
}
