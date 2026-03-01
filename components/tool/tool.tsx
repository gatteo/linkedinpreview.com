'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Eye, PenLine } from 'lucide-react'
import { Group, Panel } from 'react-resizable-panels'

import { decodeDraft, encodeDraft } from '@/lib/draft-url'
import { cn } from '@/lib/utils'

import { EditorLoading } from './editor-loading'
import { PreviewPanel } from './preview/preview-panel'
import { ResizeHandle } from './resize-handle'

const EditorPanel = dynamic(() => import('./editor-panel').then((mod) => ({ default: mod.EditorPanel })), {
    loading: () => <EditorLoading />,
    ssr: false,
})

export type Media = { type: 'image' | 'video'; src: string }

// Helper to check if TipTap JSON has actual text content
function hasTextContent(doc: any): boolean {
    if (!doc?.content) return false
    return doc.content.some((node: any) => {
        if (node.content) {
            return node.content.some((child: any) => child.text?.trim())
        }
        return false
    })
}

type ToolProps = {
    variant?: 'default' | 'embed'
}

type MobileTab = 'editor' | 'preview'

const STORAGE_KEY = 'linkedinpreview-draft'
const SAVE_DELAY_MS = 2000
const DESKTOP_BREAKPOINT = 768

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = React.useState(false)

    React.useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
        const onChange = () => setIsDesktop(mql.matches)
        onChange()
        mql.addEventListener('change', onChange)
        return () => mql.removeEventListener('change', onChange)
    }, [])

    return isDesktop
}

function loadLocalDraft(): any | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

function useDraftPersistence(content: any) {
    const timerRef = React.useRef<ReturnType<typeof setTimeout>>(null)

    React.useEffect(() => {
        if (!content) return

        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(content))
            } catch {
                // localStorage full or unavailable - silently ignore
            }
        }, SAVE_DELAY_MS)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [content])
}

export function Tool({ variant = 'default' }: ToolProps) {
    const [content, setContent] = React.useState<any>(null)
    const [media, setMedia] = React.useState<Media | null>(null)
    const [mobileTab, setMobileTab] = React.useState<MobileTab>('editor')
    const [initialContent, setInitialContent] = React.useState<any>(undefined)
    const [isLoading, setIsLoading] = React.useState(true)
    const isDesktop = useIsDesktop()

    // Load draft: URL ?draft= param takes priority over localStorage
    React.useEffect(() => {
        async function loadDraft() {
            const params = new URLSearchParams(window.location.search)
            const draftParam = params.get('draft')

            if (draftParam) {
                const decoded = await decodeDraft(draftParam)
                if (decoded) {
                    setInitialContent(decoded)
                    setIsLoading(false)
                    return
                }
            }

            const local = loadLocalDraft()
            if (local) setInitialContent(local)
            setIsLoading(false)
        }
        loadDraft()
    }, [])

    // Browser processes #hash before React mounts, so re-scroll after loading
    React.useEffect(() => {
        if (!isLoading && window.location.hash) {
            document.querySelector(window.location.hash)?.scrollIntoView()
        }
    }, [isLoading])

    useDraftPersistence(content)

    const handleContentChange = (json: any) => {
        setContent(json)
    }

    const handleMediaChange = (newMedia: Media | null) => {
        setMedia(newMedia)
    }

    const handleShare = React.useCallback(async (): Promise<string | null> => {
        if (!content) return null
        const encoded = await encodeDraft(content)
        if (!encoded) return null

        const hash = variant === 'default' ? '#tool' : ''
        return `${window.location.origin}${window.location.pathname}?draft=${encoded}${hash}`
    }, [content, variant])

    const handleOpenFeedPreview = React.useCallback(async () => {
        if (!content) return
        const encoded = await encodeDraft(content)
        if (!encoded) return
        window.open(`/preview?draft=${encoded}`, '_blank')
    }, [content])

    if (isLoading) {
        return null
    }

    const inner = (
        <div
            className={cn(
                'border-border flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-xl border bg-white',
                variant === 'embed' && 'h-full rounded-none border-0',
            )}>
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
                <Group orientation='horizontal' className='min-h-0 flex-1'>
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

    if (variant === 'embed') {
        return inner
    }

    return (
        <section
            id='tool'
            className='border-border scroll-mt-[var(--header-height)] border-t'
            style={{
                minHeight: 'min(50vh, 520px)',
                maxHeight: 'calc(100vh - var(--header-height))',
                overflow: 'hidden',
            }}>
            <div className='max-w-content mx-auto flex h-full flex-col p-2 md:p-3'>{inner}</div>
        </section>
    )
}
