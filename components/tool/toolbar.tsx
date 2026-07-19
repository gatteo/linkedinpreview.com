'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { Editor } from '@tiptap/react'
import { Bold, Italic, List, ListOrdered, Redo, Strikethrough, Type, Underline, Undo } from 'lucide-react'
import posthog from 'posthog-js'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Icons } from '@/components/icon'

import type { FontStyleName } from './extensions/font-style'
import { applyStyles } from './utils'

// The fallback matches the panel size in ./emoji-picker so the popover does not
// resize once the picker chunk lands.
const EmojiPickerPanel = dynamic(() => import('./emoji-picker').then((mod) => ({ default: mod.EmojiPickerPanel })), {
    ssr: false,
    loading: () => (
        <div className='text-muted-foreground flex h-[352px] w-[min(21rem,calc(100vw-2.5rem))] items-center justify-center text-sm'>
            Loading emoji...
        </div>
    ),
})

// The transform keys are the ones the serializer in ./utils resolves each fontStyle
// attribute to. Building the menu previews with the same function the copied text goes
// through means the sample can never drift from what actually lands on LinkedIn.
const FONT_STYLES: { style: FontStyleName; label: string; transform: string }[] = [
    { style: 'double', label: 'Double struck', transform: 'DOUBLE' },
    { style: 'script', label: 'Script', transform: 'SCRIPT' },
    { style: 'code', label: 'Monospace', transform: 'CODE' },
    { style: 'fraktur', label: 'Fraktur', transform: 'FRAKTUR' },
]

const FONT_STYLE_OPTIONS = FONT_STYLES.map(({ style, label, transform }) => ({
    style,
    label,
    preview: applyStyles(label, [transform]),
}))

const NO_FONT_STYLE = 'none'

type Props = {
    editor: Editor | null
}

const Toolbar = ({ editor }: Props) => {
    const [emojiOpen, setEmojiOpen] = React.useState(false)
    const emojiInsertedRef = React.useRef(false)

    if (!editor) {
        return null
    }

    const trackFormatting = (formatType: string) => {
        posthog?.capture('formatting_applied', {
            format_type: formatType,
        })
    }

    // A Unicode font swaps the characters themselves, so it cannot compose with bold or
    // italic and wins over them at serialization time. Rather than leave a bold mark the
    // editor renders but the clipboard drops, the conflicting marks are cleared on both
    // sides: applying a font clears bold and italic, applying bold or italic clears the
    // font. What the editor shows is then always what gets copied.
    const activeFontStyle = FONT_STYLE_OPTIONS.find((option) => editor.isActive('fontStyle', { style: option.style }))

    const handleFontStyleChange = (value: string) => {
        if (value === NO_FONT_STYLE || value === activeFontStyle?.style) {
            editor.chain().focus().unsetFontStyle().run()
            trackFormatting('font_normal')
            return
        }

        editor
            .chain()
            .focus()
            .unsetBold()
            .unsetItalic()
            .setFontStyle(value as FontStyleName)
            .run()
        trackFormatting(`font_${value}`)
    }

    const handleEmojiSelect = (native: string) => {
        emojiInsertedRef.current = true
        editor.chain().focus().insertContent(native).run()
        trackFormatting('emoji')
        setEmojiOpen(false)
    }

    return (
        <div className='flex flex-none items-center justify-start gap-2 px-4 sm:px-6'>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => {
                            editor.chain().focus().unsetFontStyle().toggleBold().run()
                            trackFormatting('bold')
                        }}
                        variant={editor.isActive('bold') ? 'default' : 'outline'}
                        size='icon'>
                        <Bold className='size-4' />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Bold</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => {
                            editor.chain().focus().unsetFontStyle().toggleItalic().run()
                            trackFormatting('italic')
                        }}
                        variant={editor.isActive('italic') ? 'default' : 'outline'}
                        size='icon'>
                        <Italic className='size-4' />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Italic</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => {
                            editor.chain().focus().toggleStrike().run()
                            trackFormatting('strikethrough')
                        }}
                        variant={editor.isActive('strike') ? 'default' : 'outline'}
                        size='icon'>
                        <Strikethrough className='size-4' />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Strikethrough</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => {
                            editor.chain().focus().toggleUnderline().run()
                            trackFormatting('underline')
                        }}
                        variant={editor.isActive('underline') ? 'default' : 'outline'}
                        size='icon'>
                        <Underline className='size-4' />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Underline</TooltipContent>
            </Tooltip>

            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button variant={activeFontStyle ? 'default' : 'outline'} size='icon'>
                                <Type className='size-4' />
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Font</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align='start' className='w-56'>
                    <DropdownMenuRadioGroup
                        value={activeFontStyle?.style ?? NO_FONT_STYLE}
                        onValueChange={handleFontStyleChange}>
                        <DropdownMenuRadioItem value={NO_FONT_STYLE}>Normal</DropdownMenuRadioItem>
                        {FONT_STYLE_OPTIONS.map((option) => (
                            // The label renders in its own glyphs so the item previews the font, which
                            // leaves Radix typeahead nothing ASCII to match. textValue gives it the
                            // plain name back without touching what is drawn.
                            <DropdownMenuRadioItem
                                key={option.style}
                                value={option.style}
                                textValue={option.label}
                                aria-label={option.label}>
                                {option.preview}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <p className='text-muted-foreground px-1.5 py-1 text-xs leading-snug'>
                        These fonts swap the letters themselves. Unicode has no bold or italic version of them, so
                        picking one clears bold and italic.
                    </p>
                </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation='vertical' className='h-full' />

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => {
                            editor.chain().focus().toggleBulletList().run()
                            trackFormatting('bullet_list')
                        }}
                        variant={editor.isActive('bulletList') ? 'default' : 'outline'}
                        size='icon'>
                        <List className='size-4' />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Bullet List</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => {
                            editor.chain().focus().toggleOrderedList().run()
                            trackFormatting('ordered_list')
                        }}
                        variant={editor.isActive('orderedList') ? 'default' : 'outline'}
                        size='icon'>
                        <ListOrdered className='size-4' />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Ordered List</TooltipContent>
            </Tooltip>

            <Separator orientation='vertical' className='h-full' />

            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button variant='outline' size='icon'>
                                <Icons.emoji className='size-4' />
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Emoji</TooltipContent>
                </Tooltip>
                <PopoverContent
                    align='start'
                    className='w-auto overflow-hidden p-0'
                    onCloseAutoFocus={(event) => {
                        // Closing after an insert should leave the caret in the editor.
                        // Every other close (escape, click outside) keeps the Radix
                        // default of returning focus to the trigger.
                        if (!emojiInsertedRef.current) return
                        emojiInsertedRef.current = false
                        event.preventDefault()
                        editor.commands.focus()
                    }}>
                    <EmojiPickerPanel onSelect={handleEmojiSelect} />
                </PopoverContent>
            </Popover>

            <Separator orientation='vertical' className='h-full' />

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        variant='outline'
                        size='icon'>
                        <Undo className='size-4' />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        variant='outline'
                        size='icon'>
                        <Redo className='size-4' />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
            </Tooltip>
        </div>
    )
}

export { Toolbar }
