'use client'

import React from 'react'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Share2 } from 'lucide-react'
import posthog from 'posthog-js'
import { toast } from 'sonner'

import { getPostAnalytics } from '@/lib/post-analytics'
import { useFeedbackAfterCopy } from '@/hooks/use-feedback-after-copy'

import { Icons } from '../icon'
import { Button } from '../ui/button'
import { EditorLoading } from './editor-loading'
import { GenerateSheet } from './generate-sheet'
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
            Placeholder.configure({
                placeholder: 'Write something… or generate with AI',
            }),
        ],
        editorProps: {
            attributes: {
                class: 'prose-md focus:outline-none resize-none block w-full p-0 text-gray-900 border-none appearance-none placeholder:text-gray-500 focus:ring-0 overflow-y-auto h-full',
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

    const onCopied = React.useCallback(
        (json: any, text: string) => {
            toast.success('Text copied to clipboard')
            notifyCopy(text.length)
            posthog.capture('post_copied', getPostAnalytics(json, text, !!currentMedia))
        },
        [notifyCopy, currentMedia],
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

            // Use synchronous clipboardData API — navigator.clipboard.writeText()
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
        <div className='flex size-full flex-col'>
            <style>{listStyles}</style>
            {/** Panel title */}
            <div className='flex h-16 border-b'>
                <div className='flex min-w-0 grow items-center overflow-x-auto'>
                    <Toolbar editor={editor} />
                </div>
            </div>

            {/** Editor */}
            <div className='grow overflow-y-auto px-4 py-5 sm:px-6'>
                <div className='not-prose relative text-sm font-normal'>
                    <EditorContent editor={editor} />
                </div>
            </div>

            {/** Character count */}
            <div className='px-4 pb-1 sm:px-6'>
                <span className='text-xs tabular-nums text-muted-foreground'>
                    {charCount} {charCount === 1 ? 'char' : 'chars'}
                </span>
            </div>

            {/** Actions */}
            <div className='border-t px-4 py-3 sm:px-6'>
                <div className='flex flex-row gap-2 sm:items-center sm:justify-between sm:gap-6'>
                    <div className='flex items-center justify-start gap-2'>
                        {/* <div className='group relative'>
                            <Button
                                variant='outline'
                                size='icon'
                                onClick={() => toast.info('Feature not available yet')}>
                                <Icons.emoji className='size-4' />
                            </Button>
                            <span className='absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:scale-100'>
                                Insert Emoji
                            </span>
                        </div> */}

                        <div className='group relative'>
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='image/*,video/mp4,video/quicktime,video/webm'
                                className='hidden'
                                onChange={handleFileChange}
                            />
                            {currentMedia ? (
                                <Button variant='outline' size='icon' onClick={handleRemoveMedia} title='Remove Media'>
                                    <Icons.image className='size-4' />
                                </Button>
                            ) : (
                                <Button variant='outline' size='icon' onClick={handleImageUpload}>
                                    <Icons.image className='size-4' />
                                </Button>
                            )}
                            <span className='absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:scale-100'>
                                {currentMedia ? 'Remove Media' : 'Add Image or Video'}
                            </span>
                        </div>

                        {/* <div className='group relative'>
                            <Button
                                variant='outline'
                                size='icon'
                                onClick={() => toast.info('Feature not available yet')}>
                                <Icons.carousel className='size-4' />
                            </Button>
                            <span className='absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:scale-100'>
                                Add Carousel
                            </span>
                        </div> */}

                        <div className='group relative'>
                            <Button variant='outline' size='icon' onClick={() => setGenerateOpen(true)}>
                                <Icons.magic className='size-4' />
                            </Button>
                            <span className='absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:scale-100'>
                                Generate with AI
                            </span>
                        </div>
                    </div>
                    <div className='flex flex-1 items-center justify-end gap-2 sm:gap-4'>
                        {onShare && (
                            <>
                                <div className='group relative'>
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
                                    <span className='absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:scale-100'>
                                        Share Draft
                                    </span>
                                </div>
                                {shareUrl && (
                                    <ShareDialog url={shareUrl} open={shareOpen} onOpenChange={setShareOpen} />
                                )}
                            </>
                        )}
                        <Button variant='default' onClick={handleCopy}>
                            <Icons.copy className='mr-2 size-4' />
                            Copy Text
                        </Button>
                    </div>
                </div>
            </div>

            <GenerateSheet
                open={generateOpen}
                onOpenChange={setGenerateOpen}
                onInsert={(text) => {
                    editor?.commands.setContent(text)
                    setGenerateOpen(false)
                }}
            />
        </div>
    )
}
