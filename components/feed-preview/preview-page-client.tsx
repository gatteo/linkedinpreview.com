'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { decodeDraft } from '@/lib/draft-url'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/icon'

import { LINKEDIN_BG } from './constants'
import { FeedLayout } from './feed-layout'
import { FeedPostCard } from './feed-post-card'

type Mode = 'desktop' | 'mobile'

const DESKTOP_BREAKPOINT = 768

interface PreviewPageClientProps {
    encodedDraft?: string
}

export function PreviewPageClient({ encodedDraft }: PreviewPageClientProps) {
    const [mode, setMode] = React.useState<Mode>(() =>
        typeof window !== 'undefined' && window.innerWidth < DESKTOP_BREAKPOINT ? 'mobile' : 'desktop',
    )
    const [content, setContent] = React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const postRef = React.useRef<HTMLDivElement>(null)
    const hasScrolled = React.useRef(false)

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

    return (
        <div className='flex min-h-screen flex-col'>
            {/* Top bar */}
            <div className='sticky top-0 z-10 border-b border-black/8 bg-white'>
                <div className='mx-auto flex h-14 max-w-5xl items-center justify-between px-4'>
                    <Link
                        href={backHref}
                        className='text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors'>
                        <ArrowLeft className='size-4' />
                        Back to Editor
                    </Link>

                    <h1 className='text-base font-semibold'>Feed Preview</h1>

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
                    </div>
                </div>
            </div>

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
        </div>
    )
}
