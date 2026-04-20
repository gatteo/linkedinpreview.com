import type { Metadata } from 'next'

import { StrategyPage } from '@/components/dashboard/strategy/strategy-page'

export const metadata: Metadata = { title: 'Content Strategy - LinkedInPreview.com' }

export default function StrategyPageRoute() {
    return <StrategyPage />
}
