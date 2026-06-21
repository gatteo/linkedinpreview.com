import { Suspense } from 'react'
import type { Metadata } from 'next'

import { CarouselEditor } from '@/components/dashboard/carousel/carousel-editor'
import { EditorLoading } from '@/components/tool/editor-loading'

export const metadata: Metadata = {
    title: 'Carousel Editor - LinkedInPreview.com',
}

export default function CarouselEditorPage() {
    return (
        <Suspense fallback={<EditorLoading />}>
            <CarouselEditor />
        </Suspense>
    )
}
