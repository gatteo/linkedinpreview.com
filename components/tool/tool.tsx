'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight, Eye, PenLine } from 'lucide-react'
import posthog from 'posthog-js'
import { Group, Panel } from 'react-resizable-panels'
import { toast } from 'sonner'

import { Routes } from '@/config/routes'
import { decodeDraft, encodeDraft } from '@/lib/draft-url'
import { extractPlainText, hasTextContent } from '@/lib/editor-utils'
import { cn } from '@/lib/utils'
import { useIsDesktop } from '@/hooks/use-is-desktop'

import { EditorLoading } from './editor-loading'
import { PreviewPanel } from './preview/preview-panel'
import { ResizeHandle } from './resize-handle'

const EditorPanel = dynamic(() => import('./editor-panel').then((mod) => ({ default: mod.EditorPanel })), {
    loading: () => <EditorLoading />,
    ssr: false,
})

export type Media = { type: 'image' | 'video'; src: string }

type ToolProps = {
    variant?: 'default' | 'embed'
    injectedDoc?: any
}

type MobileTab = 'editor' | 'preview'

const STORAGE_KEY = 'linkedinpreview-draft'
const SAVE_DELAY_MS = 2000
// One-time nudge toward the dashboard once the user has written a real post.
const NUDGE_KEY = 'lip-dashboard-nudge-seen'
const NUDGE_MIN_CHARS = 160

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

export function Tool({ variant = 'default', injectedDoc }: ToolProps) {
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

    // Memoized so the EditorPanel inject effect (which depends on onChange) does not
    // re-fire on every render. An unstable identity here causes an infinite
    // setContent -> render -> new onChange -> effect loop when injectedDoc is set.
    const handleContentChange = React.useCallback((json: any) => {
        setContent(json)
    }, [])

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
        posthog.capture('feed_preview_opened')
        window.open(`/preview?draft=${encoded}`, '_blank')
    }, [content])

    const handleOpenDashboard = React.useCallback(
        async (source: string) => {
            posthog.capture('cta_button_clicked', { button_name: 'open_dashboard', source })
            if (!content) {
                window.location.href = Routes.Dashboard
                return
            }
            const encoded = await encodeDraft(content)
            if (!encoded) {
                window.location.href = Routes.Dashboard
                return
            }
            window.location.href = `/dashboard/editor?import=${encoded}`
        },
        [content],
    )

    // Light, one-time nudge: once the user has written a real post, invite them to
    // continue in the dashboard (which carries this draft over via ?import=).
    const nudgeShownRef = React.useRef(false)
    React.useEffect(() => {
        if (variant !== 'default' || nudgeShownRef.current) return
        if (extractPlainText(content).length < NUDGE_MIN_CHARS) return

        // Arm the once-per-session guard now that we've decided to act, then bail
        // if a previous session already showed it. localStorage may be unavailable
        // (private mode); the ref then keeps it to once per session.
        let alreadySeen = false
        try {
            alreadySeen = !!localStorage.getItem(NUDGE_KEY)
        } catch {
            // ignore - fall back to once-per-session via the ref
        }
        nudgeShownRef.current = true
        if (alreadySeen) return
        try {
            localStorage.setItem(NUDGE_KEY, '1')
        } catch {
            // ignore - persisted guard unavailable, ref still prevents re-firing this session
        }

        posthog.capture('dashboard_nudge_shown', { source: 'tool' })
        toast('Nice post! Want to save it?', {
            description:
                'Continue in the dashboard to save this draft, schedule it, and write more with AI - free, no sign-up.',
            duration: 12000,
            action: {
                label: 'Open dashboard',
                onClick: () => handleOpenDashboard('tool_nudge'),
            },
        })
    }, [content, variant, handleOpenDashboard])

    if (isLoading) {
        return null
    }

    const inner = (
        <div
            className={cn(
                'border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-white',
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
                            injectedDoc={injectedDoc}
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
                            promptBranding={variant === 'default'}
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
                                injectedDoc={injectedDoc}
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
                                promptBranding={variant === 'default'}
                                onOpenFeedPreview={handleOpenFeedPreview}
                                hasContent={hasTextContent(content)}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Dashboard prompt - shown when user has written content */}
            {variant === 'default' && hasTextContent(content) && (
                <div className='border-border bg-muted/30 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 border-t px-4 py-2.5 text-xs'>
                    <span className='text-foreground font-medium'>Like what you see?</span>
                    <span className='text-muted-foreground hidden sm:inline'>
                        Save this draft, schedule it, and write your next posts with AI.
                    </span>
                    <button
                        type='button'
                        onClick={() => handleOpenDashboard('tool_footer')}
                        className='text-primary hover:text-primary/80 group inline-flex items-center gap-1 font-semibold'>
                        Continue in dashboard
                        <ArrowRight className='size-3 transition-transform group-hover:translate-x-0.5' />
                    </button>
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
            style={{ height: 'max(70vh, 520px)' }}>
            <div className='max-w-content mx-auto flex h-full flex-col p-2 md:p-3'>{inner}</div>
        </section>
    )
}
