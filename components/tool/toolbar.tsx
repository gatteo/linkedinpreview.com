'use client'

import React from 'react'
import type { Editor } from '@tiptap/react'
import { Bold, Italic, List, ListOrdered, Redo, Strikethrough, Underline, Undo } from 'lucide-react'
import posthog from 'posthog-js'

import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

type Props = {
    editor: Editor | null
}

const Toolbar = ({ editor }: Props) => {
    if (!editor) {
        return null
    }

    const trackFormatting = (formatType: string) => {
        posthog.capture('formatting_applied', {
            format_type: formatType,
        })
    }

    return (
        <div className='flex flex-none items-center justify-start gap-2 px-4 sm:px-6'>
            <Button
                onClick={() => {
                    editor.chain().focus().toggleBold().run()
                    trackFormatting('bold')
                }}
                variant={editor.isActive('bold') ? 'default' : 'outline'}
                size='icon'>
                <Bold className='size-4' />
            </Button>

            <Button
                onClick={() => {
                    editor.chain().focus().toggleItalic().run()
                    trackFormatting('italic')
                }}
                variant={editor.isActive('italic') ? 'default' : 'outline'}
                size='icon'>
                <Italic className='size-4' />
            </Button>

            <Button
                onClick={() => {
                    editor.chain().focus().toggleStrike().run()
                    trackFormatting('strikethrough')
                }}
                variant={editor.isActive('strike') ? 'default' : 'outline'}
                size='icon'>
                <Strikethrough className='size-4' />
            </Button>

            <Button
                onClick={() => {
                    editor.chain().focus().toggleUnderline().run()
                    trackFormatting('underline')
                }}
                variant={editor.isActive('underline') ? 'default' : 'outline'}
                size='icon'>
                <Underline className='size-4' />
            </Button>

            <Separator orientation='vertical' className='h-full' />

            <Button
                onClick={() => {
                    editor.chain().focus().toggleBulletList().run()
                    trackFormatting('bullet_list')
                }}
                variant={editor.isActive('bulletList') ? 'default' : 'outline'}
                size='icon'>
                <List className='size-4' />
            </Button>

            <Button
                onClick={() => {
                    editor.chain().focus().toggleOrderedList().run()
                    trackFormatting('ordered_list')
                }}
                variant={editor.isActive('orderedList') ? 'default' : 'outline'}
                size='icon'>
                <ListOrdered className='size-4' />
            </Button>

            <Separator orientation='vertical' className='h-full' />

            <Button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                variant='outline'
                size='icon'>
                <Undo className='size-4' />
            </Button>

            <Button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                variant='outline'
                size='icon'>
                <Redo className='size-4' />
            </Button>
        </div>
    )
}

export default Toolbar
