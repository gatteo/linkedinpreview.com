'use client'

import React from 'react'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { toast } from 'sonner'

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

export function EditorPanel({ onChange }: { onChange: (json: any) => void }) {
    const editor = useEditor({
        // immediatelyRender: false,
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

        const textContent = toPlainText(processNodes(editor.getJSON()).content)

        navigator.clipboard
            .writeText(textContent)
            .then(() => toast.success('Text copied to clipboard'))
            .catch((err) => toast.error(`Failed to copy text: ${err}`))
    }, [editor])

    React.useEffect(() => {
        const interceptCopy = (event: ClipboardEvent) => {
            event.preventDefault()
            handleCopy()
        }

        document.addEventListener('copy', interceptCopy)
        return () => document.removeEventListener('copy', interceptCopy)
    }, [handleCopy])

    if (!editor) {
        return <EditorLoading />
    }

    return (
        <div className='flex size-full flex-col'>
            <style>{listStyles}</style>
            {/** Panel title */}
            <div className='flex h-16 border-b px-4 sm:px-6'>
                <div className='flex grow items-center justify-between'>
                    <Toolbar editor={editor} />
                </div>
            </div>

            {/** Editor */}
            <div className='grow overflow-y-auto px-4 py-5 sm:px-6'>
                <div className='not-prose relative text-sm font-normal'>
                    <EditorContent editor={editor} />
                </div>
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
                            <Button
                                variant='outline'
                                size='icon'
                                onClick={() => toast.info('Feature not available yet')}>
                                <Icons.image className='size-4' />
                            </Button>
                            <span className='absolute -top-10 left-1/2 -translate-x-1/2 scale-0 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 group-hover:scale-100'>
                                Add Image
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
