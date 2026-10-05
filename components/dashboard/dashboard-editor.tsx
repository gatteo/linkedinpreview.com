'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { BarChart3, CopyIcon, Eye, PenLine } from 'lucide-react'
import { Group, Panel } from 'react-resizable-panels'
import { toast } from 'sonner'

import { assembleBrandingContext, brandingRulesForGenerate } from '@/lib/ai-branding'
import { readDraftFirst, requestPlanning, writeDraftFirst, type DraftFirstState } from '@/lib/draft-first'
import { pruneDraftMedia, putDraftMedia } from '@/lib/draft-media'
import { encodeDraft } from '@/lib/draft-url'
import { extractPlainText, hasTextContent } from '@/lib/editor-utils'
import { cn } from '@/lib/utils'
import { useBranding } from '@/hooks/use-branding'
import { useCurrentDraft } from '@/hooks/use-current-draft'
import { useIsDesktop } from '@/hooks/use-is-desktop'
import { usePlan } from '@/hooks/use-plan'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AIActions } from '@/components/dashboard/ai-actions'
import { useAuth } from '@/components/dashboard/auth-provider'
import { LabelPicker } from '@/components/dashboard/label-picker'
import { track } from '@/components/dashboard/onboarding/ai'
import { PublishControls } from '@/components/dashboard/publish-controls'
import { StatusPicker } from '@/components/dashboard/status-picker'
import { useUpgradePrompt } from '@/components/dashboard/upgrade-provider'
import { EditorLoading } from '@/components/tool/editor-loading'
import { PreviewPanel } from '@/components/tool/preview/preview-panel'
import { ResizeHandle } from '@/components/tool/resize-handle'

import { AnalyzePanel } from './analyze/analyze-panel'
import { PageHeader } from './page-header'

const EditorPanel = dynamic(
    () => import('@/components/tool/editor-panel').then((mod) => ({ default: mod.EditorPanel })),
    { loading: () => <EditorLoading />, ssr: false },
)

type Media = { type: 'image' | 'video'; src: string }
type MobileTab = 'editor' | 'preview' | 'analyze'
type RightTab = 'preview' | 'analyze'

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
    const {
        draftId,
        initialContent,
        initialMedia,
        label,
        status,
        scheduledAt,
        linkedinPostUrl,
        isLoading,
        saveContent,
        saveMedia,
        saveLabel,
        saveStatus,
        flush,
        saveSchedule,
        applyPublished,
    } = useCurrentDraft()
    const { branding } = useBranding()
    const { userId } = useAuth()
    const { isPaid } = usePlan()
    const { openUpgrade } = useUpgradePrompt()
    const [currentContent, setCurrentContent] = React.useState<{ id: string | null; doc: any } | null>(null)
    const content = currentContent?.id === draftId ? currentContent?.doc : null
    const [activation, setActivation] = React.useState<DraftFirstState | null>(null)
    const initialEditorDocRef = React.useRef<{ id: string | null; serialized: string } | null>(null)
    const [media, setMedia] = React.useState<Media | null>(null)
    const [mobileTab, setMobileTab] = React.useState<MobileTab>('editor')
    const [rightTab, setRightTab] = React.useState<RightTab>('preview')
    const [contentReplace, setContentReplace] = React.useState<string | null>(null)
    const isDesktop = useIsDesktop()

    // Sync initial media from loaded draft
    React.useEffect(() => {
        setMedia(initialMedia)
    }, [draftId, initialMedia])

    React.useEffect(() => {
        setActivation(readDraftFirst(userId))
    }, [userId, draftId])

    const recordUse = React.useCallback(
        (action: 'edit' | 'copy') => {
            const choice = readDraftFirst(userId)
            if (!userId || choice?.draftId !== draftId || choice.used) return
            track('draft_first_used', { action })
            const used = { ...choice, used: true }
            writeDraftFirst(userId, used)
            setActivation(used)
        },
        [userId, draftId],
    )

    const handleContentChange = React.useCallback(
        (json: any) => {
            setCurrentContent({ id: draftId, doc: json })
            const serialized = JSON.stringify(json)
            if (initialEditorDocRef.current?.id !== draftId) {
                initialEditorDocRef.current = { id: draftId, serialized }
            } else if (extractPlainText(json) && serialized !== initialEditorDocRef.current.serialized) {
                recordUse('edit')
            }
            saveContent(json)
        },
        [draftId, recordUse, saveContent],
    )

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

    // Media is a data URL, far too large for the URL, so it is handed off through
    // IndexedDB and the preview tab reads it once via the `m` key.
    const handleOpenFeedPreview = React.useCallback(async () => {
        if (!content) return
        const encoded = await encodeDraft(content)
        if (!encoded) return
        const mediaKey = media ? await putDraftMedia(media) : null
        const url = mediaKey ? `/preview?draft=${encoded}&m=${mediaKey}` : `/preview?draft=${encoded}`
        window.open(url, '_blank')
        // Reclaim stale records here too, so cleanup does not depend on the preview tab ever loading.
        // Safe after the write: the record just handed off is the newest, so neither the TTL sweep
        // nor the oldest-first trim can drop it.
        void pruneDraftMedia().catch(() => {})
    }, [content, media])

    const handleApplySuggestion = React.useCallback((newText: string) => {
        setContentReplace(newText)
    }, [])

    const contentText = React.useMemo(() => extractPlainText(content), [content])
    const brandingContext = React.useMemo(() => assembleBrandingContext(branding), [branding])
    const { dosDonts: brandingDosDonts } = React.useMemo(() => brandingRulesForGenerate(branding), [branding])
    const previewAuthor = {
        name: branding.profile.name,
        headline: branding.profile.headline,
        avatarUrl: branding.profile.avatarUrl,
    }

    const handleCopyText = React.useCallback(async () => {
        const text = contentText
        if (!text) return
        await navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
        recordUse('copy')
    }, [contentText, recordUse])

    const importedReady = activation?.draftId === draftId && !!contentText
    React.useEffect(() => {
        if (importedReady && !isPaid) track('draft_first_pro_action_view', { action: 'higher_ai_limits' })
    }, [importedReady, isPaid])

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
                initialContent={content ?? initialContent}
                initialMedia={media}
                onCopyText={() => recordUse('copy')}
                onChange={handleContentChange}
                onMediaChange={handleMediaChange}
                onShare={handleShare}
                contentReplace={contentReplace}
                onContentReplaceApplied={() => setContentReplace(null)}
            />
            <AIActions
                postText={contentText}
                brandingContext={brandingContext}
                dosDonts={brandingDosDonts}
                onResult={handleApplySuggestion}
            />
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
                        author={previewAuthor}
                        onOpenFeedPreview={handleOpenFeedPreview}
                        hasContent={hasTextContent(content)}
                    />
                ) : (
                    <AnalyzePanel
                        content={content}
                        contentText={contentText}
                        hasImage={!!media}
                        brandingContext={brandingContext}
                        dosDonts={brandingDosDonts}
                        onApplySuggestion={handleApplySuggestion}
                    />
                )}
            </div>
        </div>
    )

    return (
        <>
            <PageHeader title='Editor'>
                <StatusPicker
                    value={status}
                    onChange={saveStatus}
                    aria-label='Post status (manual label, does not publish to LinkedIn)'
                />
                <LabelPicker value={label} onChange={saveLabel} aria-label='Post format label' />
                <Button variant='outline' size='sm' onClick={handleCopyText} disabled={!contentText}>
                    <CopyIcon className='size-4' />
                    Copy Text
                </Button>
                <PublishControls
                    draftId={draftId}
                    status={status}
                    scheduledAt={scheduledAt}
                    linkedinPostUrl={linkedinPostUrl}
                    hasContent={!!contentText}
                    onFlush={flush}
                    onScheduled={saveSchedule}
                    onPublished={applyPublished}
                />
            </PageHeader>

            {importedReady && (
                <div className='border-border bg-secondary flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2 text-xs'>
                    <span className='text-muted-foreground'>Your draft is ready. Planning is optional.</span>
                    <Button variant='ghost' size='sm' onClick={requestPlanning}>
                        Create my LinkedIn plan
                    </Button>
                    {!isPaid && (
                        <Button variant='outline' size='sm' onClick={() => openUpgrade('imported_draft')}>
                            Get higher AI limits with Pro
                        </Button>
                    )}
                </div>
            )}

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
                                    author={previewAuthor}
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
                                    brandingContext={brandingContext}
                                    dosDonts={brandingDosDonts}
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
