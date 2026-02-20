'use client'

import React from 'react'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import posthog from 'posthog-js'
import { toast } from 'sonner'

import { useFeedbackAfterCopy } from '@/hooks/use-feedback-after-copy'

import { Icons } from '../icon'
import { Button } from '../ui/button'
import { EditorLoading } from './editor-loading'
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
    onChange,
    onImageChange,
}: {
    onChange: (json: any) => void
    onImageChange: (imageSrc: string | null) => void
}) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [currentImage, setCurrentImage] = React.useState<string | null>(null)
    const { notifyCopy } = useFeedbackAfterCopy()

    const handleImageChangeWrapper = React.useCallback(
        (imageSrc: string | null) => {
            setCurrentImage(imageSrc)
            onImageChange(imageSrc)
        },
        [onImageChange],
    )

    const editor = useEditor({
        immediatelyRender: false,
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
                placeholder: 'Write something …',
            }),
        ],
        editorProps: {
            attributes: {
                class: 'prose-md focus:outline-none resize-none block w-full p-0 text-gray-900 border-none appearance-none placeholder:text-gray-500 focus:ring-0 overflow-y-auto h-full',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON())
        },
    })

    const handleCopy = React.useCallback(() => {
        if (!editor) return

        // @ts-expect-error - TODO: fix this
        const textContent = toPlainText(processNodes(editor.getJSON()).content)

        navigator.clipboard
            .writeText(textContent)
            .then(() => {
                toast.success('Text copied to clipboard')
                notifyCopy(textContent.length)

                // Track post copied event
                posthog.capture('post_copied', {
                    content_length: textContent.length,
                })
            })
            .catch((err) => {
                posthog.captureException(err)
                toast.error(`Failed to copy text: ${err}`)
            })
    }, [editor, notifyCopy])

    React.useEffect(() => {
        const interceptCopy = (event: ClipboardEvent) => {
            event.preventDefault()
            handleCopy()
        }

        document.addEventListener('copy', interceptCopy)
        return () => document.removeEventListener('copy', interceptCopy)
    }, [handleCopy])

    const handleImageUpload = React.useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    const handleFileChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            if (!file) return

            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file')
                return
            }

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB')
                return
            }

            const reader = new FileReader()
            reader.onload = (e) => {
                const src = e.target?.result as string
                if (src) {
                    handleImageChangeWrapper(src)
                    toast.success('Image added successfully')

                    // Track image added event
                    posthog.capture('image_added', {
                        image_type: file.type,
                        image_size_bytes: file.size,
                    })
                }
            }
            reader.onerror = () => {
                toast.error('Failed to read image file')
                posthog.captureException(new Error('Failed to read image file'))
            }
            reader.readAsDataURL(file)

            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        },
        [handleImageChangeWrapper],
    )

    const handleRemoveImage = React.useCallback(() => {
        handleImageChangeWrapper(null)
        toast.success('Image removed')

        // Track image removed event
        posthog.capture('image_removed')
    }, [handleImageChangeWrapper])

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
                        <div className='group relative'>
                            <Button
                                variant='outline'
                                size='icon'
                                onClick={() => toast.info('Feature not available yet')}>
                                <Icons.emoji className='size-4' />
                            </Button>
                            <span className='absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:scale-100'>
                                Insert Emoji
                            </span>
                        </div>

                        <div className='group relative'>
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='image/*'
                                className='hidden'
                                onChange={handleFileChange}
                            />
                            {currentImage ? (
                                <Button variant='outline' size='icon' onClick={handleRemoveImage} title='Remove Image'>
                                    <Icons.image className='size-4' />
                                </Button>
                            ) : (
                                <Button variant='outline' size='icon' onClick={handleImageUpload}>
                                    <Icons.image className='size-4' />
                                </Button>
                            )}
                            <span className='absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:scale-100'>
                                {currentImage ? 'Remove Image' : 'Add Image'}
                            </span>
                        </div>

                        <div className='group relative'>
                            <Button
                                variant='outline'
                                size='icon'
                                onClick={() => toast.info('Feature not available yet')}>
                                <Icons.carousel className='size-4' />
                            </Button>
                            <span className='absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:scale-100'>
                                Add Carousel
                            </span>
                        </div>

                        <div className='group relative'>
                            <Button
                                variant='outline'
                                size='icon'
                                onClick={() => toast.info('Feature not available yet')}>
                                <Icons.magic className='size-4' />
                            </Button>
                            <span className='absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:scale-100'>
                                Rewrite with AI
                            </span>
                        </div>
                    </div>
                    <div className='flex flex-1 items-center justify-end gap-2 sm:gap-4'>
                        <Button variant='default' onClick={handleCopy}>
                            <Icons.copy className='mr-2 size-4' />
                            Copy Text
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
