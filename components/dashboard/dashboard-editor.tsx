'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Eye, PenLine } from 'lucide-react'
import { Group, Panel } from 'react-resizable-panels'

import { encodeDraft } from '@/lib/draft-url'
import { hasTextContent } from '@/lib/editor-utils'
import { cn } from '@/lib/utils'
import { useCurrentDraft } from '@/hooks/use-current-draft'
import { useIsDesktop } from '@/hooks/use-is-desktop'
import { Skeleton } from '@/components/ui/skeleton'
import { EditorLoading } from '@/components/tool/editor-loading'
import { PreviewPanel } from '@/components/tool/preview/preview-panel'
import { ResizeHandle } from '@/components/tool/resize-handle'

const EditorPanel = dynamic(
    () => import('@/components/tool/editor-panel').then((mod) => ({ default: mod.EditorPanel })),
    { loading: () => <EditorLoading />, ssr: false },
)

type Media = { type: 'image' | 'video'; src: string }
type MobileTab = 'editor' | 'preview'

export function DashboardEditor() {
    const { initialContent, initialMedia, isLoading, saveContent, saveMedia } = useCurrentDraft()
    const [content, setContent] = React.useState<any>(null)
    const [media, setMedia] = React.useState<Media | null>(null)
    const [mobileTab, setMobileTab] = React.useState<MobileTab>('editor')
    const isDesktop = useIsDesktop()

    // Sync initial media from loaded draft
    React.useEffect(() => {
        if (initialMedia) setMedia(initialMedia)
    }, [initialMedia])

    const handleContentChange = (json: any) => {
        setContent(json)
        saveContent(json)
    }

    const handleMediaChange = (newMedia: Media | null) => {
        setMedia(newMedia)
        saveMedia(newMedia)
    }

    const handleShare = React.useCallback(async (): Promise<string | null> => {
        if (!content) return null
        const encoded = await encodeDraft(content)
        if (!encoded) return null
        return `${window.location.origin}/?draft=${encoded}#tool`
    }, [content])

    const handleOpenFeedPreview = React.useCallback(async () => {
        if (!content) return
        const encoded = await encodeDraft(content)
        if (!encoded) return
        window.open(`/preview?draft=${encoded}`, '_blank')
    }, [content])

    if (isLoading) {
        return (
            <div className='bg-background flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row'>
                <div className='flex min-w-0 flex-1 flex-col'>
                    <EditorLoading />
                </div>
                <div className='hidden flex-col border-l lg:flex lg:flex-1'>
                    <div className='flex flex-col gap-4 p-6'>
                        <Skeleton className='h-6 w-32' />
                        <Skeleton className='aspect-[9/16] w-full max-w-sm rounded-xl' />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='bg-background flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
            {/* Mobile tab bar */}
            {!isDesktop && (
                <div className='border-border flex border-b'>
                    <button
                        type='button'
                        onClick={() => setMobileTab('editor')}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                            mobileTab === 'editor'
                                ? 'border-foreground text-foreground border-b-2'
                                : 'text-muted-foreground hover:text-foreground',
                        )}>
                        <PenLine className='size-4' />
                        Editor
                    </button>
                    <button
                        type='button'
                        onClick={() => setMobileTab('preview')}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                            mobileTab === 'preview'
                                ? 'border-foreground text-foreground border-b-2'
                                : 'text-muted-foreground hover:text-foreground',
                        )}>
                        <Eye className='size-4' />
                        Preview
                    </button>
                </div>
            )}

            {/* Panels */}
            {isDesktop ? (
                <Group orientation='horizontal' className='min-h-0 w-full flex-1 overflow-hidden'>
                    <Panel defaultSize='50%' minSize='30%' className='flex min-w-0 flex-col'>
                        <EditorPanel
                            initialContent={initialContent}
                            onChange={handleContentChange}
                            onMediaChange={handleMediaChange}
                            onShare={handleShare}
                        />
                    </Panel>
                    <ResizeHandle />
                    <Panel defaultSize='50%' minSize='25%' maxSize='60%' className='flex flex-col'>
                        <PreviewPanel
                            content={content}
                            media={media}
                            onOpenFeedPreview={handleOpenFeedPreview}
                            hasContent={hasTextContent(content)}
                        />
                    </Panel>
                </Group>
            ) : (
                <div className='flex min-h-0 flex-1'>
                    {mobileTab === 'editor' ? (
                        <div className='flex min-w-0 flex-1 flex-col'>
                            <EditorPanel
                                initialContent={initialContent}
                                onChange={handleContentChange}
                                onMediaChange={handleMediaChange}
                                onShare={handleShare}
                            />
                        </div>
                    ) : (
                        <div className='flex w-full flex-1 flex-col'>
                            <PreviewPanel
                                content={content}
                                media={media}
                                onOpenFeedPreview={handleOpenFeedPreview}
                                hasContent={hasTextContent(content)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
