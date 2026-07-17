'use client'

// ---------------------------------------------------------------------------
// Inline rich-text editing for a text element. Mounted in place of the static
// TextElementView while a text element is being edited (double-click). Styling
// mirrors the static view exactly so entering/leaving edit mode does not shift
// the text. The whole edit session is coalesced into one undo step via the
// store batch around the editor's lifetime.
// ---------------------------------------------------------------------------
import * as React from 'react'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { resolveColor, type ResolvedTheme } from '@/lib/carousel/theme'
import { type TextElement } from '@/lib/carousel/types'

import { useStoreApi } from '../use-carousel-store'

type Props = {
    slideId: string
    el: TextElement
    theme: ResolvedTheme
    onExit: () => void
}

export function EditableText({ slideId, el, theme, onExit }: Props) {
    const store = useStoreApi()

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit.configure({ heading: false }), Underline],
        content: (el.html as object) ?? { type: 'doc', content: [{ type: 'paragraph' }] },
        autofocus: 'end',
        editorProps: { attributes: { class: 'cf-editable' } },
        onUpdate: ({ editor: e }) => {
            store.updateElement(slideId, el.id, { html: e.getJSON(), text: e.getText() })
        },
    })

    React.useEffect(() => {
        store.beginBatch()
        return () => store.endBatch()
    }, [store])

    const color = resolveColor(theme, el.colorToken, el.color)
    const justify = el.valign === 'top' ? 'flex-start' : el.valign === 'bottom' ? 'flex-end' : 'center'

    return (
        <div
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
                if (e.key === 'Escape') {
                    e.preventDefault()
                    onExit()
                }
            }}
            style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                transform: el.rotation ? `rotate(${el.rotation}deg)` : 'none',
                transformOrigin: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: justify,
                overflow: 'hidden',
                fontFamily: theme.fonts[el.fontToken],
                fontSize: el.fontSize,
                fontWeight: el.fontWeight,
                lineHeight: el.lineHeight,
                letterSpacing: el.letterSpacing,
                textAlign: el.align,
                color,
                pointerEvents: 'auto',
            }}>
            <EditorContent editor={editor} />
        </div>
    )
}
