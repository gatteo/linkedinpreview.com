import { Suspense } from 'react'
import type { Metadata } from 'next'

import { DashboardEditor } from '@/components/dashboard/dashboard-editor'
import { EditorLoading } from '@/components/tool/editor-loading'

export const metadata: Metadata = {
    title: 'Editor - LinkedInPreview.com',
}

export default function EditorPage() {
    return (
        <Suspense fallback={<EditorLoading />}>
            <DashboardEditor />
        </Suspense>
    )
}
