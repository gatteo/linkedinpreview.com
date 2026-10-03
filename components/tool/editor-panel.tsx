'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import Underline from '@tiptap/extension-underline'
import type { Slice } from '@tiptap/pm/model'
import { AllSelection, Selection } from '@tiptap/pm/state'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Share2, Trash2 } from 'lucide-react'
import posthog from 'posthog-js'
import { toast } from 'sonner'

import { ApiRoutes } from '@/config/routes'
import { countWords } from '@/lib/content-scoring'
import { countPostCharacters, LINKEDIN_CHAR_LIMIT } from '@/lib/linkedin/char-count'
import { toTipTapParagraphs } from '@/lib/parse-formatted-text'
import { getPostAnalytics } from '@/lib/post-analytics'
import { cn } from '@/lib/utils'
import { useAnonymousAuth } from '@/hooks/use-anonymous-auth'
import { useFeedbackAfterCopy } from '@/hooks/use-feedback-after-copy'
import { FontStyle } from '@/components/tool/extensions/font-style'

import { Icons } from '../icon'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../ui/alert-dialog'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { EditorLoading } from './editor-loading'
import { ShareDialog } from './share-dialog'
import type { Media } from './tool'
import { Toolbar } from './toolbar'
import { processNodes, toPlainText } from './utils'

const AIGenerateSheet = dynamic(
    () => import('../ai-chat/ai-generate-sheet').then((mod) => ({ default: mod.AIGenerateSheet })),
    {
        ssr: false,
    },
)

// The Undo action for a clear lives in the toast, and previousMedia is reachable only
// through that toast's closure, so the toast's lifetime is the entire undo window: once it
// goes, Ctrl+Z brings the text back from editor history but the media is gone for good.
// Sonner's 4 second default is far too short for a dialog that promises both back, and the
// dialog quotes this number so the promise and the behavior cannot drift apart.
const CLEAR_UNDO_WINDOW_MS = 15000

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

// A slice cut open at a block boundary carries an empty block on the open side: a drag
// that stops just before the next paragraph yields a trailing paragraph with no content,
// and one that starts at the end of a paragraph yields a leading one. That block is not a
// blank line the user selected, it is the boundary the selection crossed, so it is worth
// the single break that separates two blocks rather than the two an empty paragraph
// renders as. Giving it empty text says exactly that: it still separates the blocks around
// it, it just contributes no characters of its own. Only the first and last node can be
// artifacts, and only on a side the slice is actually open at, which is what tells them
// apart from a blank line the user really typed.
function markCutBoundaries(nodes: any[], slice: Slice): any[] {
    const isEmptyBlock = (node: any) => !node?.content?.length
    const last = nodes.length - 1
    const openStart = slice.openStart > 0 && isEmptyBlock(nodes[0])
    const openEnd = slice.openEnd > 0 && isEmptyBlock(nodes[last])
    if (!openStart && !openEnd) return nodes

    const boundary = { type: 'paragraph', content: [{ type: 'text', text: '' }] }
    const marked = [...nodes]
    if (openStart) marked[0] = boundary
    if (openEnd) marked[last] = boundary
    return marked
}

// A slice cut out of the middle of an ordered list is itself a complete list, so it
// renumbers from 1 and silently corrupts the steps on paste. ProseMirror keeps the index
// of the selected item on the resolved position, so carry it onto the copied list as its
// start attribute. Only the outermost list is adjusted: it is the one the slice's first
// node corresponds to.
function withOrderedListStart(nodes: any[], selection: Selection): any[] {
    const [first, ...rest] = nodes
    if (first?.type !== 'orderedList') return nodes

    const { $from } = selection
    for (let depth = 1; depth <= $from.depth; depth++) {
        const node = $from.node(depth)
        if (node.type.name !== 'orderedList') continue

        const index = $from.index(depth)
        if (index === 0) return nodes

        const start = (typeof node.attrs.start === 'number' ? node.attrs.start : 1) + index
        return [{ ...first, attrs: { ...first.attrs, start } }, ...rest]
    }

    return nodes
}

export function EditorPanel({
    initialContent,
    injectedDoc,
    onInjectedDocApplied,
    onRestoreDoc,
    onChange,
    onMediaChange,
    onShare,
    contentReplace,
    onContentReplaceApplied,
}: {
    initialContent?: any
    injectedDoc?: any
    onInjectedDocApplied?: () => void
    onRestoreDoc?: (doc: any) => void
    onChange: (json: any) => void
    onMediaChange: (media: Media | null) => void
    onShare?: () => Promise<string | null>
    contentReplace?: string | null
    onContentReplaceApplied?: () => void
}) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const justClearedRef = React.useRef(false)
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
            FontStyle,
        ],
        editorProps: {
            attributes: {
                class: 'prose-md focus:outline-hidden resize-none block w-full p-0 text-foreground border-none appearance-none placeholder:text-muted-foreground focus:ring-0 overflow-y-auto h-full',
            },
        },
        onCreate: ({ editor }) => {
            if (initialContent) onChange(editor.getJSON())
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON())
        },
    })

    // Apply an externally injected document (e.g. an AI-generated post) live.
    // A new doc object on each generation re-fires this effect. Reporting it applied lets
    // the owner drop it: this effect also runs on mount, so a document still held there is
    // re-applied by every remount, overwriting whatever was written in the meantime.
    React.useEffect(() => {
        if (!editor || !injectedDoc) return
        editor.commands.setContent(injectedDoc, true)
        onChange(editor.getJSON())
        onInjectedDocApplied?.()
    }, [editor, injectedDoc, onChange, onInjectedDocApplied])

    const getEditorContent = React.useCallback(() => {
        if (!editor) return null
        const json = editor.getJSON()
        // @ts-expect-error - TODO: fix this
        const text = toPlainText(processNodes(json).content) as string
        return { json, text }
    }, [editor])

    // Serializes only the selected range through the same Unicode styling pipeline
    // as a full copy. Returns null when nothing is selected.
    const getSelectionContent = React.useCallback(() => {
        if (!editor) return null
        const { selection } = editor.state
        if (selection.empty) return null

        const slice = selection.content()
        const nodes = slice.content.toJSON()
        if (!Array.isArray(nodes) || nodes.length === 0) return null

        const content = withOrderedListStart(markCutBoundaries(nodes, slice), selection)
        const json = { type: 'doc', content }
        const text = toPlainText(processNodes(json).content ?? [], { range: true })
        return { json, text }
    }, [editor])

    // Cmd/Ctrl+A produces an AllSelection, but a drag or Shift+Cmd+Arrow that reaches
    // both ends of the document produces a TextSelection instead, so both shapes have
    // to count as a whole-post copy. The bounds come from ProseMirror rather than from
    // arithmetic on doc.content.size: a post that opens or closes with a list nests its
    // first and last text positions inside listItem and paragraph tokens, several
    // positions clear of the document edges, so a fixed 1 .. size - 1 window never
    // matches one. atStart/atEnd resolve through any nesting depth.
    //
    // Positions alone still miss shapes though. A trailing empty paragraph (the user
    // pressed Enter at the end) puts atEnd past the last visible character, and a
    // leading or trailing atom such as a horizontal rule puts atStart/atEnd somewhere a
    // text drag cannot reach, so in both cases dragging over the entire post falls short
    // of the bounds. Comparing what the two paths actually serialize catches every such
    // shape, including ones nobody has enumerated, so it backs the bounds check up.
    const isWholeDocSelection = React.useCallback(() => {
        if (!editor) return false
        const { selection, doc } = editor.state
        if (selection instanceof AllSelection) return true
        if (selection.from <= Selection.atStart(doc).from && selection.to >= Selection.atEnd(doc).to) return true

        const selectedText = getSelectionContent()?.text.trim()
        if (!selectedText) return false
        return selectedText === getEditorContent()?.text.trim()
    }, [editor, getSelectionContent, getEditorContent])

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

    // Scoped to the editor node so copies elsewhere on the page (the tool is embedded
    // mid-page on the homepage) keep their own clipboard payload untouched. That scoping is
    // the whole pass-through guarantee: a copy event only reaches this listener when its
    // target is the editor node or sits inside it, so there is nothing left to filter here.
    React.useEffect(() => {
        if (!editor) return
        const editorDom = editor.view.dom

        const writeStyledText = (event: ClipboardEvent, text: string) => {
            event.preventDefault()

            // Clear ProseMirror's text/html so paste targets (e.g. LinkedIn's
            // contenteditable) fall back to text/plain with our Unicode-styled text.
            event.clipboardData?.clearData()
            event.clipboardData?.setData('text/plain', text)
        }

        const interceptCopy = (event: ClipboardEvent) => {
            // A selection that spans the whole document is a full-post copy and has to
            // behave exactly like the Copy button. Only a genuine sub-range is partial.
            const selected = isWholeDocSelection() ? null : getSelectionContent()
            if (selected) {
                if (!selected.text) return
                writeStyledText(event, selected.text)
                posthog?.capture('post_partial_copied', { content_length: selected.text.length })
                return
            }

            const content = getEditorContent()
            // Never wipe the clipboard for an empty document.
            if (!content || !content.text) return
            writeStyledText(event, content.text)
            onCopied(content.json, content.text)
        }

        editorDom.addEventListener('copy', interceptCopy)
        return () => editorDom.removeEventListener('copy', interceptCopy)
    }, [editor, isWholeDocSelection, getSelectionContent, getEditorContent, onCopied])

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

    const handleClearAll = React.useCallback(() => {
        if (!editor) return

        const cleared = getEditorContent()
        const hadMedia = !!currentMedia
        // Undo has to restore both halves together: editor history alone would bring the
        // text back but leave the media gone, since the media lives outside ProseMirror.
        const previousDoc = editor.getJSON()
        const previousMedia = currentMedia

        editor.commands.clearContent(true)
        handleMediaChangeWrapper(null)
        onChange(editor.getJSON())
        justClearedRef.current = true

        toast.success('Editor cleared', {
            duration: CLEAR_UNDO_WINDOW_MS,
            action: {
                label: 'Undo',
                onClick: () => {
                    // Route through the owner rather than this closure's editor: crossing the
                    // 640px breakpoint (a phone rotation does it) remounts and destroys that
                    // instance, so restoring through it would silently no-op and lose the post.
                    if (onRestoreDoc) {
                        onRestoreDoc(previousDoc)
                    } else {
                        editor.commands.setContent(previousDoc, true)
                        onChange(editor.getJSON())
                    }
                    handleMediaChangeWrapper(previousMedia)
                    posthog?.capture('post_clear_undone', { had_media: hadMedia })
                },
            },
        })
        posthog?.capture('post_cleared', {
            had_media: hadMedia,
            char_count: countPostCharacters(cleared?.text ?? ''),
        })
    }, [editor, getEditorContent, currentMedia, handleMediaChangeWrapper, onChange, onRestoreDoc])

    React.useEffect(() => {
        if (!contentReplace || !editor) return
        const paragraphs = toTipTapParagraphs(contentReplace)
        editor.commands.setContent({ type: 'doc', content: paragraphs }, true)
        onChange(editor.getJSON())
        onContentReplaceApplied?.()
    }, [contentReplace]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!editor) {
        return <EditorLoading />
    }

    // Characters are counted on the exact string the copy path produces (in grapheme
    // clusters) because LinkedIn receives those bytes, list markers included. Words are
    // counted on the raw editor text so injected markers like '•' or '1.' are not words.
    const copyText = getEditorContent()?.text ?? ''
    const charCount = countPostCharacters(copyText)
    const wordCount = countWords(editor.getText())
    const isEmpty = !copyText.trim()
    const overBy = charCount - LINKEDIN_CHAR_LIMIT
    const isOverLimit = overBy > 0

    return (
        <div className='flex size-full min-h-0 flex-col'>
            <style>{listStyles}</style>
            {/** Panel title */}
            <div className='bg-card border-border flex h-14 shrink-0 border-b'>
                <div className='flex min-w-0 grow items-center overflow-x-auto'>
                    <Toolbar editor={editor} />
                </div>
            </div>

            {/** Editor */}
            <div className='min-h-0 grow overflow-y-auto px-4 py-5 sm:px-6'>
                <div className='not-prose relative text-sm font-normal'>
                    <EditorContent editor={editor} />
                    {isEmpty && (
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

            {/** Character and word count */}
            <div className='flex shrink-0 items-center gap-3 px-4 pb-1 sm:px-6'>
                <span
                    className={cn(
                        'text-xs tabular-nums',
                        isOverLimit ? 'text-error font-medium' : 'text-muted-foreground',
                    )}>
                    {charCount} / {LINKEDIN_CHAR_LIMIT} chars
                </span>
                <span className='text-muted-foreground text-xs tabular-nums'>
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
                {isOverLimit && (
                    <span className='text-error text-xs font-medium tabular-nums'>{overBy} over the limit</span>
                )}
            </div>

            {/** Actions */}
            <div className='border-border shrink-0 border-t px-4 py-3 sm:px-6'>
                <div className='flex flex-row gap-2 sm:items-center sm:justify-between sm:gap-6'>
                    <div className='flex items-center justify-start gap-2'>
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

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant='outline' size='icon' onClick={() => setGenerateOpen(true)}>
                                    <Icons.magic className='size-4' />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Generate with AI</TooltipContent>
                        </Tooltip>

                        <AlertDialog>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant='outline'
                                            size='icon'
                                            disabled={isEmpty && !currentMedia}
                                            aria-label='Clear all'>
                                            <Trash2 className='size-4' />
                                        </Button>
                                    </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>Clear All</TooltipContent>
                            </Tooltip>
                            <AlertDialogContent
                                onCloseAutoFocus={(event) => {
                                    // After a clear the trigger is disabled, so put the caret back
                                    // in the editor instead of letting focus fall to the body.
                                    if (!justClearedRef.current) return
                                    justClearedRef.current = false
                                    event.preventDefault()
                                    editor.commands.focus()
                                }}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Clear this post?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This removes the text and any attached image or video. Use the Undo button in
                                        the confirmation that appears within {CLEAR_UNDO_WINDOW_MS / 1000} seconds to
                                        bring both back.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction variant='destructive' onClick={handleClearAll}>
                                        Clear all
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
