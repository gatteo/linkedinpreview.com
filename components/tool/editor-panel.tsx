'use client'

import React from 'react'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Share2 } from 'lucide-react'
import posthog from 'posthog-js'
import { toast } from 'sonner'

import { ApiRoutes } from '@/config/routes'
import { toTipTapParagraphs } from '@/lib/parse-formatted-text'
import { getPostAnalytics } from '@/lib/post-analytics'
import { useAnonymousAuth } from '@/hooks/use-anonymous-auth'
import { useFeedbackAfterCopy } from '@/hooks/use-feedback-after-copy'

import { AIGenerateSheet } from '../ai-chat/sheet'
import { Icons } from '../icon'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { EditorLoading } from './editor-loading'
import { ShareDialog } from './share-dialog'
import type { Media } from './tool'
import Toolbar from './toolbar'
import { processNodes, toPlainText } from './utils'

const listStyles = `
  .ProseMirror ul, .ProseMirror ol {
    padding-left: 1.5em;
  }
  .ProseMirror ul > li {
    list-style-type: disc;
  }
  .ProseMirror ol > li {
    list-style-type: decimal;
  }
`

export function EditorPanel({
    initialContent,
    onChange,
    onMediaChange,
    onShare,
}: {
    initialContent?: any
    onChange: (json: any) => void
    onMediaChange: (media: Media | null) => void
    onShare?: () => Promise<string | null>
}) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [currentMedia, setCurrentMedia] = React.useState<Media | null>(null)
    const [shareUrl, setShareUrl] = React.useState<string | null>(null)
    const [shareOpen, setShareOpen] = React.useState(false)
    const [generateOpen, setGenerateOpen] = React.useState(false)
    const { notifyCopy } = useFeedbackAfterCopy()
    const { ensureSession } = useAnonymousAuth()

    const handleMediaChangeWrapper = React.useCallback(
        (media: Media | null) => {
            setCurrentMedia(media)
            onMediaChange(media)
        },
        [onMediaChange],
    )

    const editor = useEditor({
        immediatelyRender: false,
        content: initialContent ?? undefined,
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Underline,
        ],
        editorProps: {
            attributes: {
                class: 'prose-md focus:outline-hidden resize-none block w-full p-0 text-neutral-900 border-none appearance-none placeholder:text-neutral-500 focus:ring-0 overflow-y-auto h-full',
            },
        },
        onCreate: ({ editor }) => {
            if (initialContent) onChange(editor.getJSON())
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON())
        },
    })

    const getEditorContent = React.useCallback(() => {
        if (!editor) return null
        const json = editor.getJSON()
        // @ts-expect-error - TODO: fix this
        const text = toPlainText(processNodes(json).content) as string
        return { json, text }
    }, [editor])

    const analyzePost = React.useCallback(
        async (json: any, text: string) => {
            try {
                await ensureSession()
                const analytics = getPostAnalytics(json, text, !!currentMedia)
                const res = await fetch(ApiRoutes.Analyze, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        postText: text,
                        hasImage: analytics.has_image,
                        hasFormatting: analytics.has_formatting,
                        contentLength: analytics.content_length,
                        lineCount: analytics.line_count,
                        hashtagCount: analytics.hashtag_count,
                        emojiCount: analytics.emoji_count,
                    }),
                })
                if (!res.ok) return
                posthog.capture('post_analyzed', { content_length: text.length })
            } catch {
                // silently fail - background analytics
            }
        },
        [ensureSession, currentMedia],
    )

    const onCopied = React.useCallback(
        (json: any, text: string) => {
            toast.success('Text copied to clipboard')
            notifyCopy(text.length)
            posthog.capture('post_copied', getPostAnalytics(json, text, !!currentMedia))
            analyzePost(json, text) // fire-and-forget
        },
        [notifyCopy, currentMedia, analyzePost],
    )

    const handleCopy = React.useCallback(() => {
        const content = getEditorContent()
        if (!content) return

        navigator.clipboard
            .writeText(content.text)
            .then(() => onCopied(content.json, content.text))
            .catch((err) => {
                posthog.captureException(err)
                toast.error(`Failed to copy text: ${err}`)
            })
    }, [getEditorContent, onCopied])

    React.useEffect(() => {
        const interceptCopy = (event: ClipboardEvent) => {
            const content = getEditorContent()
            if (!content) return
            event.preventDefault()

            // Use synchronous clipboardData API - navigator.clipboard.writeText()
            // requires transient user activation which Firefox denies in copy events
            event.clipboardData?.setData('text/plain', content.text)
            onCopied(content.json, content.text)
        }

        document.addEventListener('copy', interceptCopy)
        return () => document.removeEventListener('copy', interceptCopy)
    }, [getEditorContent, onCopied])

    const handleImageUpload = React.useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    const handleFileChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            if (!file) return

            const isVideo = file.type.startsWith('video/')
            const isImage = file.type.startsWith('image/')

            if (!isImage && !isVideo) {
                toast.error('Please select an image or video file')
                return
            }

            const maxSize = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024
            if (file.size > maxSize) {
                toast.error(isVideo ? 'Video size must be less than 25MB' : 'Image size must be less than 5MB')
                return
            }

            const reader = new FileReader()
            reader.onload = (e) => {
                const src = e.target?.result as string
                if (src) {
                    const mediaType = isVideo ? 'video' : 'image'
                    handleMediaChangeWrapper({ type: mediaType, src })
                    toast.success(isVideo ? 'Video added successfully' : 'Image added successfully')

                    posthog.capture('media_added', {
                        media_type: mediaType,
                        file_type: file.type,
                        file_size_bytes: file.size,
                    })
                }
            }
            reader.onerror = () => {
                toast.error(isVideo ? 'Failed to read video file' : 'Failed to read image file')
                posthog.captureException(new Error(`Failed to read ${isVideo ? 'video' : 'image'} file`))
            }
            reader.readAsDataURL(file)

            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        },
        [handleMediaChangeWrapper],
    )

    const handleRemoveMedia = React.useCallback(() => {
        const mediaType = currentMedia?.type
        handleMediaChangeWrapper(null)
        toast.success(mediaType === 'video' ? 'Video removed' : 'Image removed')

        posthog.capture('media_removed', { media_type: mediaType })
    }, [handleMediaChangeWrapper, currentMedia])

    if (!editor) {
        return <EditorLoading />
    }

    const text = editor.getText()
    const charCount = text.length

    return (
        <div className='flex size-full min-h-0 flex-col'>
            <style>{listStyles}</style>
            {/** Panel title */}
            <div className='border-border flex h-14 shrink-0 border-b'>
                <div className='flex min-w-0 grow items-center overflow-x-auto'>
                    <Toolbar editor={editor} />
                </div>
            </div>

            {/** Editor */}
            <div className='min-h-0 grow overflow-y-auto px-4 py-5 sm:px-6'>
                <div className='not-prose relative text-sm font-normal'>
                    <EditorContent editor={editor} />
                    {!text.trim() && (
                        <div className='text-muted-foreground/60 pointer-events-none absolute inset-x-0 -top-0.5 flex items-center text-sm'>
                            Write something… or{' '}
                            <button
                                onClick={() => setGenerateOpen(true)}
                                className='text-shimmer border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 pointer-events-auto ml-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-medium transition-all'>
                                <Icons.magic className='text-primary size-3.5' />
                                <span>Generate with AI</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/** Character count */}
            <div className='shrink-0 px-4 pb-1 sm:px-6'>
                <span className='text-muted-foreground text-xs tabular-nums'>
                    {charCount} {charCount === 1 ? 'char' : 'chars'}
                </span>
            </div>

            {/** Actions */}
            <div className='border-border shrink-0 border-t px-4 py-3 sm:px-6'>
                <div className='flex flex-row gap-2 sm:items-center sm:justify-between sm:gap-6'>
                    <div className='flex items-center justify-start gap-2'>
                        {/* <div className='group relative'>
                            <Button
                                variant='outline'
                                size='icon'
                                onClick={() => toast.info('Feature not available yet')}>
                                <Icons.emoji className='size-4' />
                            </Button>
                            <span className='absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded-md bg-neutral-900 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:scale-100'>
                                Insert Emoji
                            </span>
                        </div> */}

                        <input
                            ref={fileInputRef}
                            type='file'
                            accept='image/*,video/mp4,video/quicktime,video/webm'
                            className='hidden'
                            onChange={handleFileChange}
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {currentMedia ? (
                                    <Button variant='outline' size='icon' onClick={handleRemoveMedia}>
                                        <Icons.image className='size-4' />
                                    </Button>
                                ) : (
                                    <Button variant='outline' size='icon' onClick={handleImageUpload}>
                                        <Icons.image className='size-4' />
                                    </Button>
                                )}
                            </TooltipTrigger>
                            <TooltipContent>{currentMedia ? 'Remove Media' : 'Add Image or Video'}</TooltipContent>
                        </Tooltip>

                        {/* <div className='group relative'>
                            <Button
                                variant='outline'
                                size='icon'
                                onClick={() => toast.info('Feature not available yet')}>
                                <Icons.carousel className='size-4' />
                            </Button>
                            <span className='absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded-md bg-neutral-900 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:scale-100'>
                                Add Carousel
                            </span>
                        </div> */}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant='outline' size='icon' onClick={() => setGenerateOpen(true)}>
                                    <Icons.magic className='size-4' />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Generate with AI</TooltipContent>
                        </Tooltip>
                    </div>
                    <div className='flex flex-1 items-center justify-end gap-2 sm:gap-4'>
                        {onShare && (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant='outline'
                                            size='icon'
                                            onClick={() => {
                                                onShare()
                                                    .then((url) => {
                                                        if (url) {
                                                            setShareUrl(url)
                                                            setShareOpen(true)
                                                        }
                                                    })
                                                    .catch(() => {
                                                        toast.error('Failed to create share link')
                                                    })
                                            }}>
                                            <Share2 className='size-4' />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Share Draft</TooltipContent>
                                </Tooltip>
                                {shareUrl && (
                                    <ShareDialog url={shareUrl} open={shareOpen} onOpenChange={setShareOpen} />
                                )}
                            </>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant='default' onClick={handleCopy}>
                                    <Icons.copy className='mr-1 size-4' />
                                    Copy Text
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy to Clipboard</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>

            <AIGenerateSheet
                open={generateOpen}
                onOpenChange={setGenerateOpen}
                onInsert={(text) => {
                    if (!editor) return
                    const paragraphs = toTipTapParagraphs(text)
                    editor.commands.setContent({ type: 'doc', content: paragraphs }, true)
                    onChange(editor.getJSON())
                }}
            />
        </div>
    )
}
