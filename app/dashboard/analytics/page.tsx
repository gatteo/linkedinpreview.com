import type { Metadata } from 'next'

import { AnalyticsPage } from '@/components/dashboard/analytics/analytics-page'

export const metadata: Metadata = { title: 'Analytics - LinkedInPreview.com' }

export default function AnalyticsPageRoute() {
    return <AnalyticsPage />
}
