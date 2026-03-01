import type { Metadata } from 'next'

import { site } from '@/config/site'
import { PreviewPageClient } from '@/components/feed-preview/preview-page-client'

export const metadata: Metadata = {
    title: 'Feed Preview',
    description:
        'See how your LinkedIn post looks in a realistic feed on desktop and mobile before publishing. Preview your post alongside other posts to check formatting and readability.',
    openGraph: {
        title: 'Feed Preview | LinkedIn Post Preview',
        description: 'See how your LinkedIn post looks in a realistic feed on desktop and mobile before publishing.',
        url: `${site.url}/preview`,
    },
    alternates: {
        canonical: `${site.url}/preview`,
    },
}

type Props = {
    searchParams: Promise<{ draft?: string }>
}

export default async function PreviewPage({ searchParams }: Props) {
    const { draft } = await searchParams
    return <PreviewPageClient encodedDraft={draft} />
}
