'use client'

import React from 'react'
import { Eye, PenLine } from 'lucide-react'

import { decodeDraft, encodeDraft } from '@/lib/draft-url'
import { cn } from '@/lib/utils'

import { EditorPanel } from './editor-panel'
import { PreviewPanel } from './preview/preview-panel'

export type Media = { type: 'image' | 'video'; src: string }

type ToolProps = {
    variant?: 'default' | 'embed'
}

type MobileTab = 'editor' | 'preview'

const STORAGE_KEY = 'linkedinpreview-draft'
const SAVE_DELAY_MS = 2000

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
                // localStorage full or unavailable — silently ignore
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

    if (isLoading) {
        return null
    }

    const inner = (
        <div
            className={cn(
                'flex min-h-[520px] flex-1 flex-col rounded-sm border',
                variant === 'embed' && 'h-full border-0',
            )}>
            {/* Mobile tab bar — hidden on desktop where both panels are visible */}
            <div className='flex border-b md:hidden'>
                <button
                    type='button'
                    onClick={() => setMobileTab('editor')}
                    className={cn(
                        'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                        mobileTab === 'editor'
                            ? 'border-b-2 border-foreground text-foreground'
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
                            ? 'border-b-2 border-foreground text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    )}>
                    <Eye className='size-4' />
                    Preview
                </button>
            </div>

            {/* Panels — on mobile only the active tab is visible; on desktop both show side-by-side */}
            <div className='flex flex-1'>
                <div className={cn('min-w-0 flex-1 flex-col', mobileTab === 'editor' ? 'flex' : 'hidden md:flex')}>
                    <EditorPanel
                        initialContent={initialContent}
                        onChange={handleContentChange}
                        onMediaChange={handleMediaChange}
                        onShare={handleShare}
                    />
                </div>
                <div
                    className={cn(
                        'w-full flex-1 flex-col md:max-w-[600px] md:border-l',
                        mobileTab === 'preview' ? 'flex' : 'hidden md:flex',
                    )}>
                    <PreviewPanel content={content} media={media} />
                </div>
            </div>
        </div>
    )

    if (variant === 'embed') {
        return inner
    }

    return (
        <section id='tool' className='mx-auto max-w-content px-6 py-16 md:py-24'>
            {inner}
        </section>
    )
}
