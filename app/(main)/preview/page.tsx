import type { Metadata } from 'next'

import { PreviewPageClient } from '@/components/feed-preview/preview-page-client'

export const metadata: Metadata = {
    title: 'Feed Preview | LinkedIn Post Preview',
}

type Props = {
    searchParams: Promise<{ draft?: string }>
}

export default async function PreviewPage({ searchParams }: Props) {
    const { draft } = await searchParams
    return <PreviewPageClient encodedDraft={draft} />
}
