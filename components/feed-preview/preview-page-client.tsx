'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Share2 } from 'lucide-react'
import posthog from 'posthog-js'

import { decodeDraft } from '@/lib/draft-url'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/icon'
import { ShareDialog } from '@/components/tool/share-dialog'

import { LINKEDIN_BG } from './constants'
import { FeedLayout } from './feed-layout'
import { FeedPostCard } from './feed-post-card'
import { LinkedInHeader } from './linkedin-header'

type Mode = 'desktop' | 'mobile'

const DESKTOP_BREAKPOINT = 768

interface PreviewPageClientProps {
    encodedDraft?: string
}

export function PreviewPageClient({ encodedDraft }: PreviewPageClientProps) {
    const [mode, setMode] = React.useState<Mode>('desktop')
    const [content, setContent] = React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [shareOpen, setShareOpen] = React.useState(false)
    const postRef = React.useRef<HTMLDivElement>(null)
    const hasScrolled = React.useRef(false)

    // Sync mode with actual viewport width on mount + resize
    React.useEffect(() => {
        const update = () => setMode(window.innerWidth < DESKTOP_BREAKPOINT ? 'mobile' : 'desktop')
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    React.useEffect(() => {
        posthog.capture('feed_preview_page_viewed')
    }, [])

    React.useEffect(() => {
        async function decode() {
            if (!encodedDraft) {
                setIsLoading(false)
                return
            }
            const decoded = await decodeDraft(encodedDraft)
            setContent(decoded)
            setIsLoading(false)
        }
        decode()
    }, [encodedDraft])

    React.useEffect(() => {
        if (!isLoading && content && postRef.current && !hasScrolled.current) {
            hasScrolled.current = true
            postRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [isLoading, content])

    const backHref = encodedDraft ? `/?draft=${encodedDraft}#tool` : '/#tool'

    const shareUrl =
        typeof window !== 'undefined' && encodedDraft ? `${window.location.origin}/preview?draft=${encodedDraft}` : ''

    return (
        <div className='flex min-h-screen flex-col'>
            {/* Tool header */}
            <div className='sticky top-0 z-10 border-b border-black/8 bg-white'>
                <div className='mx-auto flex h-14 max-w-[1128px] items-center justify-between gap-2 px-4'>
                    <Button variant='outline' size='sm' asChild>
                        <Link href={backHref} aria-label='Back to post editor'>
                            <ArrowLeft className='size-4' />
                            <span className='hidden sm:inline'>Back to post editor</span>
                        </Link>
                    </Button>

                    <div className='flex items-center gap-1'>
                        <button
                            type='button'
                            onClick={() => setMode('desktop')}
                            className={cn(
                                'rounded-md p-1.5 transition-colors',
                                mode === 'desktop'
                                    ? 'bg-foreground text-background'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                            )}
                            aria-label='Desktop view'>
                            <Icon name='desktop' className='size-4' />
                        </button>
                        <button
                            type='button'
                            onClick={() => setMode('mobile')}
                            className={cn(
                                'rounded-md p-1.5 transition-colors',
                                mode === 'mobile'
                                    ? 'bg-foreground text-background'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                            )}
                            aria-label='Mobile view'>
                            <Icon name='mobile' className='size-4' />
                        </button>

                        {encodedDraft && (
                            <>
                                <div className='bg-border mx-1.5 h-4 w-px' />
                                <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    aria-label='Share this preview'
                                    onClick={() => setShareOpen(true)}>
                                    <Share2 className='size-4' />
                                    <span className='hidden sm:inline'>Share this preview</span>
                                </Button>
                                <ShareDialog url={shareUrl} open={shareOpen} onOpenChange={setShareOpen} />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* LinkedIn header simulation */}
            <LinkedInHeader />

            {/* Body */}
            <div className='flex flex-1 justify-center' style={{ backgroundColor: LINKEDIN_BG }}>
                {isLoading ? (
                    <div className='flex items-center justify-center py-20'>
                        <div className='bg-muted h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent' />
                    </div>
                ) : !content ? (
                    <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
                        <p className='text-muted-foreground text-sm'>No post content found.</p>
                        <Link href='/#tool' className='text-sm font-medium underline underline-offset-4'>
                            Go to editor
                        </Link>
                    </div>
                ) : (
                    <FeedLayout mode={mode}>
                        <div ref={postRef}>
                            <FeedPostCard content={content} media={null} />
                        </div>
                    </FeedLayout>
                )}
            </div>

            {/* Footer */}
            <footer className='border-border border-t bg-white py-4'>
                <div className='mx-auto max-w-[1128px] px-4 text-center'>
                    <Link href='/' className='text-sm text-neutral-500 transition-colors hover:text-neutral-900'>
                        &copy; {new Date().getFullYear()} LinkedIn Post Preview
                    </Link>
                </div>
            </footer>
        </div>
    )
}
