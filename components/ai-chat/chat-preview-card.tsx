'use client'

import { useMemo } from 'react'

import { toTipTapParagraphs } from '@/lib/parse-formatted-text'
import { ActionButtons } from '@/components/tool/preview/action-buttons'
import { renderWithHashtags } from '@/components/tool/preview/content-section'
import { ScreenSizeProvider } from '@/components/tool/preview/preview-size-context'
import { Reactions } from '@/components/tool/preview/reactions'
import { UserInfo } from '@/components/tool/preview/user-info'
import { processNodes, toPlainText } from '@/components/tool/utils'

interface ChatPreviewCardProps {
    text: string
    isStreaming: boolean
}

export function ChatPreviewCard({ text, isStreaming }: ChatPreviewCardProps) {
    const processedText = useMemo(() => {
        if (!text) return ''
        const doc = { type: 'doc', content: toTipTapParagraphs(text) }
        // @ts-ignore -- same usage as ContentSection
        return toPlainText(processNodes(doc).content) as string
    }, [text])

    return (
        <ScreenSizeProvider initialSize='mobile'>
            <div className='border-border shadow-subtle overflow-hidden rounded-lg border bg-white'>
                <div className='px-4 pt-3'>
                    <UserInfo />
                </div>
                <div className='px-4 py-3'>
                    <div className='text-sm whitespace-pre-line text-neutral-900'>
                        {renderWithHashtags(processedText)}
                        {isStreaming && <span className='ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-neutral-900' />}
                    </div>
                </div>
                <div className='border-border border-t px-4 py-2'>
                    <Reactions />
                    <ActionButtons />
                </div>
            </div>
        </ScreenSizeProvider>
    )
}
