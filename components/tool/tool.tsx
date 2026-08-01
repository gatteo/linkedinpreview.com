'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowUpRight, Eye, PenLine } from 'lucide-react'
import posthog from 'posthog-js'
import { Group, Panel } from 'react-resizable-panels'
import { toast } from 'sonner'

import { withEntrySource, type EntrySource } from '@/config/entry-sources'
import { Routes } from '@/config/routes'
import { pruneDraftMedia, putDraftMedia } from '@/lib/draft-media'
import { decodeDraft, encodeDraft } from '@/lib/draft-url'
import { extractPlainText } from '@/lib/editor-utils'
import { cn } from '@/lib/utils'
import { backupStoredDraft, readStoredDraft, takeBackupDraft, useDraftPersistence } from '@/hooks/use-draft-persistence'
import { useIsDesktop } from '@/hooks/use-is-desktop'
import { Button } from '@/components/ui/button'

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

// One-time nudge toward the dashboard once the user has written a real post.
const NUDGE_KEY = 'lip-dashboard-nudge-seen'
const NUDGE_MIN_CHARS = 160

/**
 * Drops the params a shared link carries once they have been consumed, so a
 * refresh or a bookmark never resurrects the shared post over newer local work.
 * Uses replaceState so React state and the editor survive untouched.
 */
function stripDraftParams() {
    try {
        const url = new URL(window.location.href)
        if (!url.searchParams.has('draft') && !url.searchParams.has('m')) return
        url.searchParams.delete('draft')
        url.searchParams.delete('m')
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    } catch {
        // history/URL unavailable - the param stays, which is the old behavior
    }
}

/**
 * True when the document carries text anywhere in the tree. `hasTextContent` only looks one
 * level below the root, so a post that is entirely a bulleted list (bulletList > listItem >
 * paragraph > text) reads as empty there, which is one of the most common LinkedIn shapes.
 * extractPlainText walks the whole tree, so nesting depth stops mattering.
 */
function hasText(doc: any): boolean {
    return extractPlainText(doc).length > 0
}

/** Two documents are the same post when they serialize identically. */
function isSameDoc(a: any, b: any): boolean {
    try {
        return JSON.stringify(a) === JSON.stringify(b)
    } catch {
        return false
    }
}

export function Tool({ variant = 'default', injectedDoc }: ToolProps) {
    const [content, setContent] = React.useState<any>(null)
    const [media, setMedia] = React.useState<Media | null>(null)
    const [mobileTab, setMobileTab] = React.useState<MobileTab>('editor')
    const [initialContent, setInitialContent] = React.useState<any>(undefined)
    // A document that has to be pushed into the already mounted editor: a restored backup, or
    // a post generated on the page. It is cleared the moment the editor applies it, because a
    // document left standing here is replayed by every later remount - and crossing the 640px
    // breakpoint remounts the editor, which is what rotating a phone does.
    const [pendingDoc, setPendingDoc] = React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const isDesktop = useIsDesktop()

    const { flush } = useDraftPersistence(content)

    // Copies the saved draft aside before a document the visitor did not write here
    // (a shared link, a generated post) takes over the editor, and offers it back.
    const backupReplacedDraft = React.useCallback((incoming: any) => {
        const stored = readStoredDraft()
        if (!hasText(stored)) return
        // Returning from the feed preview re-opens the very draft that was flushed on the way
        // out, so the incoming post and the stored one are the same document. Backing that up
        // and warning about it would report a replacement that never happened.
        if (isSameDoc(incoming, stored)) return
        if (!backupStoredDraft()) return

        toast('This post replaced the draft you had here', {
            description: 'Your previous draft is safe and can be brought back.',
            duration: 15000,
            action: {
                label: 'Restore it',
                onClick: () => {
                    const restored = takeBackupDraft()
                    if (!restored) {
                        toast.error('That draft is no longer available')
                        return
                    }
                    setPendingDoc(restored)
                },
            },
        })
    }, [])

    // Load: a shared ?draft= link wins over the saved draft, and its params are
    // stripped once read so a refresh or a bookmark cannot resurrect it later.
    React.useEffect(() => {
        let cancelled = false

        async function loadDraft() {
            const draftParam = new URLSearchParams(window.location.search).get('draft')
            const shared = draftParam ? await decodeDraft(draftParam) : null
            if (cancelled) return

            stripDraftParams()

            if (shared) {
                backupReplacedDraft(shared)
                setInitialContent(shared)
            } else {
                const stored = readStoredDraft()
                if (stored) setInitialContent(stored)
            }

            setIsLoading(false)
        }

        loadDraft()

        return () => {
            cancelled = true
        }
    }, [backupReplacedDraft])

    // A generated post takes the editor over, so persist and copy aside the draft it
    // displaces. Routing it through pendingDoc rather than straight to the editor gives it
    // the same consume-once handling as a restore, and lets a new generation replace an
    // earlier restore that is still waiting.
    React.useEffect(() => {
        if (!injectedDoc) return
        flush()
        backupReplacedDraft(injectedDoc)
        setPendingDoc(injectedDoc)
    }, [injectedDoc, flush, backupReplacedDraft])

    // Marks the pushed document consumed. Without this the editor re-applies it on every
    // remount, wiping out everything written since it was first applied.
    const handlePendingDocApplied = React.useCallback(() => {
        setPendingDoc(null)
    }, [])

    // EditorPanel seeds itself from this whenever it mounts, and crossing the
    // mobile/desktop breakpoint remounts it. Seeding from the page-load document
    // there would replay stale text over everything typed since, so pass the current one.
    const seedDoc = content ?? initialContent

    // Browser processes #hash before React mounts, so re-scroll after loading
    React.useEffect(() => {
        if (!isLoading && window.location.hash) {
            document.querySelector(window.location.hash)?.scrollIntoView()
        }
    }, [isLoading])

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
        flush()

        // Media is a data URL, far too large for the share link, so it travels
        // through IndexedDB under a single-use key. Both awaits run together to
        // keep window.open close to the click and out of the popup blocker.
        const [encoded, mediaKey] = await Promise.all([encodeDraft(content), media ? putDraftMedia(media) : null])
        if (!encoded) return

        posthog.capture('feed_preview_opened')
        const mediaParam = mediaKey ? `&m=${encodeURIComponent(mediaKey)}` : ''
        window.open(`/preview?draft=${encoded}${mediaParam}`, '_blank')

        void pruneDraftMedia()
    }, [content, media, flush])

    const handleOpenDashboard = React.useCallback(
        async (source: string) => {
            posthog.capture('cta_button_clicked', { button_name: 'open_dashboard', source })
            flush()
            const entry: EntrySource = source === 'tool_nudge' ? 'tool_nudge' : 'tool_footer'
            if (!content) {
                window.location.href = withEntrySource(Routes.Dashboard, entry)
                return
            }
            const encoded = await encodeDraft(content)
            if (!encoded) {
                window.location.href = withEntrySource(Routes.Dashboard, entry)
                return
            }
            window.location.href = withEntrySource(`/dashboard/editor?import=${encoded}`, entry)
        },
        [content, flush],
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
        toast('Nice post! Want a plan behind it?', {
            description:
                'Get a free audit of your LinkedIn and a personalized 90-day posting plan - this draft comes with you.',
            duration: 12000,
            action: {
                label: 'Create my plan',
                onClick: () => handleOpenDashboard('tool_nudge'),
            },
        })
    }, [content, variant, handleOpenDashboard])

    if (isLoading) {
        return null
    }

    const contentHasText = hasText(content)

    const inner = (
        <div
            className={cn(
                'border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border',
                // Edge-to-edge on phones: side borders and corner radius would read as a seam
                // right on the screen edge.
                'max-sm:rounded-none max-sm:border-x-0',
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
                            initialContent={seedDoc}
                            injectedDoc={pendingDoc}
                            onInjectedDocApplied={handlePendingDocApplied}
                            onRestoreDoc={setPendingDoc}
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
                            hasContent={contentHasText}
                        />
                    </Panel>
                </Group>
            ) : (
                // Both panels stay mounted and the inactive one is hidden with visibility
                // rather than display. Unmounting the editor on a tab switch re-creates it
                // from the document it was seeded with, replaying that over everything typed
                // since; display:none keeps it mounted but collapses it to a zero-sized box,
                // and the preview decides its '...more' cutoff by measuring scrollHeight,
                // which then reads 0 and drops the cutoff. Out of flow plus invisible leaves
                // the active panel at full width while the hidden one is still laid out at
                // the exact size it will have when shown, so it measures correctly there and
                // needs no re-measure on the way back.
                <div className='relative flex min-h-0 flex-1'>
                    <div
                        className={cn(
                            'flex flex-col',
                            mobileTab === 'editor' ? 'min-w-0 flex-1' : 'invisible absolute inset-0',
                        )}>
                        <EditorPanel
                            initialContent={seedDoc}
                            injectedDoc={pendingDoc}
                            onInjectedDocApplied={handlePendingDocApplied}
                            onRestoreDoc={setPendingDoc}
                            onChange={handleContentChange}
                            onMediaChange={handleMediaChange}
                            onShare={handleShare}
                        />
                    </div>
                    <div
                        className={cn(
                            'flex flex-col',
                            mobileTab === 'preview' ? 'w-full flex-1' : 'invisible absolute inset-0',
                        )}>
                        <PreviewPanel
                            content={content}
                            media={media}
                            promptBranding={variant === 'default'}
                            onOpenFeedPreview={handleOpenFeedPreview}
                            hasContent={contentHasText}
                        />
                    </div>
                </div>
            )}

            {/* Dashboard prompt - shown when user has written content */}
            {variant === 'default' && contentHasText && (
                <div className='border-border bg-secondary flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-t px-5 py-2'>
                    <span className='text-muted-foreground text-[13.5px] leading-snug'>
                        <b className='text-foreground font-semibold'>Happy with this draft?</b> Get a free audit of your
                        LinkedIn and a 90-day plan - this draft comes with you.
                    </span>
                    <Button variant='outline' size='sm' onClick={() => handleOpenDashboard('tool_footer')}>
                        Create my LinkedIn plan
                        <ArrowUpRight className='size-3.5' />
                    </Button>
                </div>
            )}
        </div>
    )

    if (variant === 'embed') {
        return inner
    }

    return (
        <section id='tool' className='border-border bg-canvas scroll-mt-[var(--header-height)] border-t'>
            <div className='max-w-content border-border mx-auto border-x px-7 py-16'>
                <div className='mb-6 flex flex-wrap items-end justify-between gap-6'>
                    <div>
                        <p className='tracking-label mb-3 font-mono text-xs font-medium text-[color:var(--orange-600)] uppercase'>
                            Try it now
                        </p>
                        <h2 className='font-heading max-w-[560px] text-[clamp(28px,3.6vw,38px)] leading-[1.06] font-bold tracking-[-0.025em]'>
                            Write on the left, watch the feed on the right.
                        </h2>
                    </div>
                    <Button asChild variant='outline'>
                        <Link href={withEntrySource(Routes.DashboardEditor(), 'tool_header')}>
                            Open in full editor
                            <ArrowUpRight className='size-4' />
                        </Link>
                    </Button>
                </div>
                {/* Full-bleed below sm: the panel is the product, and 56px of gutter on a phone
                    squeezed the post preview badly enough to wrap its own caption. The heading
                    above keeps its padding so copy never touches the screen edge. */}
                <div className='flex flex-col max-sm:-mx-7' style={{ height: 'max(70vh, 520px)' }}>
                    {inner}
                </div>
            </div>
        </section>
    )
}
