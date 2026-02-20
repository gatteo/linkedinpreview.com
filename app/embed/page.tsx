import type { Metadata } from 'next'

import { EmbedTool } from '@/components/embed/embed-tool'

export const metadata: Metadata = {
    title: 'Embed | LinkedIn Post Preview',
    robots: { index: false, follow: false },
}

export default function EmbedPage() {
    return <EmbedTool />
}
