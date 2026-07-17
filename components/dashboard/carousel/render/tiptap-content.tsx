// ---------------------------------------------------------------------------
// Renders a TipTap JSON fragment (the rich content of a text element) to React
// nodes. Kept tiny and dependency-free so the export path does not pull TipTap
// in - it handles exactly the marks the editor enables (bold/italic/underline/
// strike/highlight). Inline styles here are the documented slide-renderer
// exception (per-element typography cannot be Tailwind classes).
// ---------------------------------------------------------------------------

import * as React from 'react'

type Mark = { type: string; attrs?: Record<string, unknown> }
type Node = { type?: string; text?: string; marks?: Mark[]; content?: Node[]; attrs?: Record<string, unknown> }

export function renderTiptap(doc: unknown, baseWeight: number): React.ReactNode {
    const root = doc as Node | null
    if (!root || !Array.isArray(root.content)) return null
    return root.content.map((node, i) => renderBlock(node, i, baseWeight))
}

function renderBlock(node: Node, key: number, baseWeight: number): React.ReactNode {
    const inline = node.content?.length ? node.content.map((child, i) => renderInline(child, i, baseWeight)) : null
    return (
        <p key={key} style={{ margin: 0 }}>
            {inline ?? <br />}
        </p>
    )
}

function renderInline(node: Node, key: number, baseWeight: number): React.ReactNode {
    if (node.type !== 'text' || !node.text) return null
    const style: React.CSSProperties = {}
    for (const mark of node.marks ?? []) {
        if (mark.type === 'bold') style.fontWeight = baseWeight >= 600 ? 900 : 700
        else if (mark.type === 'italic') style.fontStyle = 'italic'
        else if (mark.type === 'underline')
            style.textDecoration = style.textDecoration ? `${style.textDecoration} underline` : 'underline'
        else if (mark.type === 'strike')
            style.textDecoration = style.textDecoration ? `${style.textDecoration} line-through` : 'line-through'
        else if (mark.type === 'highlight')
            style.backgroundColor = (mark.attrs?.color as string) ?? 'rgba(255, 227, 77, 0.55)'
    }
    return (
        <span key={key} style={style}>
            {node.text}
        </span>
    )
}
