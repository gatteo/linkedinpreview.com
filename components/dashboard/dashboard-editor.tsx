'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { BarChart3, CopyIcon, Eye, PenLine } from 'lucide-react'
import { Group, Panel } from 'react-resizable-panels'
import { toast } from 'sonner'

import { assembleBrandingContext } from '@/lib/ai-branding'
import { encodeDraft } from '@/lib/draft-url'
import { hasTextContent } from '@/lib/editor-utils'
import { cn } from '@/lib/utils'
import { useBranding } from '@/hooks/use-branding'
import { useCurrentDraft } from '@/hooks/use-current-draft'
import { useIsDesktop } from '@/hooks/use-is-desktop'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AIActions } from '@/components/dashboard/ai-actions'
import { EditorLoading } from '@/components/tool/editor-loading'
import { PreviewPanel } from '@/components/tool/preview/preview-panel'
import { ResizeHandle } from '@/components/tool/resize-handle'

import { AnalyzePanel } from './analyze-panel'
import { PageHeader } from './page-header'

const EditorPanel = dynamic(
    () => import('@/components/tool/editor-panel').then((mod) => ({ default: mod.EditorPanel })),
    { loading: () => <EditorLoading />, ssr: false },
)

type Media = { type: 'image' | 'video'; src: string }
type MobileTab = 'editor' | 'preview' | 'analyze'
type RightTab = 'preview' | 'analyze'

// ---------------------------------------------------------------------------
// Extract plain text from TipTap JSON
// ---------------------------------------------------------------------------

function extractPlainText(content: any): string {
    if (!content?.content) return ''
    let text = ''
    function walk(nodes: any[]) {
        for (const node of nodes) {
            if (node.text) text += node.text
            if (node.content) walk(node.content)
            if (node.type === 'paragraph' || node.type === 'listItem') text += '\n'
        }
    }
    walk(content.content)
    return text.trim()
}

// ---------------------------------------------------------------------------
// Right panel tab bar
// ---------------------------------------------------------------------------

function RightTabBar({ tab, onTabChange }: { tab: RightTab; onTabChange: (t: RightTab) => void }) {
    return (
        <div className='border-border flex h-14 shrink-0 border-b'>
            <button
                type='button'
                onClick={() => onTabChange('preview')}
                className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 py-4 text-xs font-medium transition-colors',
                    tab === 'preview'
                        ? 'border-foreground text-foreground border-b-2'
                        : 'text-muted-foreground hover:text-foreground',
                )}>
                <Eye className='size-3.5' />
                Preview
            </button>
            <button
                type='button'
                onClick={() => onTabChange('analyze')}
                className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 py-4 text-xs font-medium transition-colors',
                    tab === 'analyze'
                        ? 'border-foreground text-foreground border-b-2'
                        : 'text-muted-foreground hover:text-foreground',
                )}>
                <BarChart3 className='size-3.5' />
                Analyze
            </button>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardEditor() {
    const { initialContent, initialMedia, isLoading, saveContent, saveMedia } = useCurrentDraft()
    const { branding } = useBranding()
    const [content, setContent] = React.useState<any>(null)
    const [media, setMedia] = React.useState<Media | null>(null)
    const [mobileTab, setMobileTab] = React.useState<MobileTab>('editor')
    const [rightTab, setRightTab] = React.useState<RightTab>('preview')
    const [contentReplace, setContentReplace] = React.useState<string | null>(null)
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

    const handleApplySuggestion = React.useCallback((newText: string) => {
        setContentReplace(newText)
    }, [])

    const contentText = React.useMemo(() => extractPlainText(content), [content])
    const brandingContext = React.useMemo(() => assembleBrandingContext(branding), [branding])

    const handleCopyText = React.useCallback(async () => {
        const text = contentText
        if (!text) return
        await navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }, [contentText])

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

    const editorPanel = (
        <div className='flex min-h-0 flex-1 flex-col'>
            <EditorPanel
                initialContent={initialContent}
                onChange={handleContentChange}
                onMediaChange={handleMediaChange}
                onShare={handleShare}
                contentReplace={contentReplace}
                onContentReplaceApplied={() => setContentReplace(null)}
            />
            <AIActions postText={contentText} brandingContext={brandingContext} onResult={handleApplySuggestion} />
        </div>
    )

    const rightPanel = (
        <div className='flex h-full flex-col'>
            <RightTabBar tab={rightTab} onTabChange={setRightTab} />
            <div className='min-h-0 flex-1 overflow-hidden'>
                {rightTab === 'preview' ? (
                    <PreviewPanel
                        content={content}
                        media={media}
                        onOpenFeedPreview={handleOpenFeedPreview}
                        hasContent={hasTextContent(content)}
                    />
                ) : (
                    <AnalyzePanel
                        content={content}
                        contentText={contentText}
                        hasImage={!!media}
                        onApplySuggestion={handleApplySuggestion}
                    />
                )}
            </div>
        </div>
    )

    return (
        <>
            <PageHeader title='Editor'>
                <Button size='sm' onClick={handleCopyText} disabled={!contentText}>
                    <CopyIcon className='size-4' />
                    Copy Text
                </Button>
            </PageHeader>

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
                        <button
                            type='button'
                            onClick={() => setMobileTab('analyze')}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                                mobileTab === 'analyze'
                                    ? 'border-foreground text-foreground border-b-2'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}>
                            <BarChart3 className='size-4' />
                            Analyze
                        </button>
                    </div>
                )}

                {/* Panels */}
                {isDesktop ? (
                    <Group orientation='horizontal' className='min-h-0 w-full flex-1 overflow-hidden'>
                        <Panel defaultSize='50%' minSize='30%' className='flex min-w-0 flex-col overflow-hidden'>
                            {editorPanel}
                        </Panel>
                        <ResizeHandle />
                        <Panel defaultSize='50%' minSize='25%' maxSize='60%' className='flex flex-col overflow-hidden'>
                            {rightPanel}
                        </Panel>
                    </Group>
                ) : (
                    <div className='flex min-h-0 flex-1'>
                        {mobileTab === 'editor' ? (
                            <div className='flex min-w-0 flex-1 overflow-hidden'>{editorPanel}</div>
                        ) : mobileTab === 'preview' ? (
                            <div className='flex w-full flex-1 flex-col'>
                                <PreviewPanel
                                    content={content}
                                    media={media}
                                    onOpenFeedPreview={handleOpenFeedPreview}
                                    hasContent={hasTextContent(content)}
                                />
                            </div>
                        ) : (
                            <div className='flex w-full flex-1 flex-col overflow-hidden'>
                                <AnalyzePanel
                                    content={content}
                                    contentText={contentText}
                                    hasImage={!!media}
                                    onApplySuggestion={handleApplySuggestion}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}
