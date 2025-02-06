'use client'

import React from 'react'
import type { Editor } from '@tiptap/react'
import { Bold, Italic, List, ListOrdered, Redo, Strikethrough, Underline, Undo } from 'lucide-react'

import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

type Props = {
    editor: Editor | null
}

const Toolbar = ({ editor }: Props) => {
    if (!editor) {
        return null
    }

    return (
        <div className='flex flex-none flex-wrap items-center justify-start gap-2'>
            <Button
                onClick={() => editor.chain().focus().toggleBold().run()}
                variant={editor.isActive('bold') ? 'default' : 'outline'}
                size='icon'>
                <Bold className='size-5' />
            </Button>

            <Button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                variant={editor.isActive('italic') ? 'default' : 'outline'}
                size='icon'>
                <Italic className='size-5' />
            </Button>

            <Button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                variant={editor.isActive('strike') ? 'default' : 'outline'}
                size='icon'>
                <Strikethrough className='size-5' />
            </Button>

            <Button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                variant={editor.isActive('underline') ? 'default' : 'outline'}
                size='icon'>
                <Underline className='size-5' />
            </Button>

            <Separator orientation='vertical' className='h-full' />

            <Button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                variant={editor.isActive('bulletList') ? 'default' : 'outline'}
                size='icon'>
                <List className='size-5' />
            </Button>

            <Button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                variant={editor.isActive('orderedList') ? 'default' : 'outline'}
                size='icon'>
                <ListOrdered className='size-5' />
            </Button>

            <Separator orientation='vertical' className='h-full' />

            <Button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                variant='outline'
                size='icon'>
                <Undo className='size-5' />
            </Button>

            <Button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                variant='outline'
                size='icon'>
                <Redo className='size-5' />
            </Button>
        </div>
    )
}

export default Toolbar
