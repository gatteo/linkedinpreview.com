import type { Metadata } from 'next'

import { SettingsForm } from '@/components/dashboard/settings-form'

export const metadata: Metadata = {
    title: 'Settings - LinkedInPreview.com',
}

export default function SettingsPage() {
    return <SettingsForm />
}
