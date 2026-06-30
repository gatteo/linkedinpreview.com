// ---------------------------------------------------------------------------
// Minimal TipTap JSON <-> plain text helpers, dependency-free so the drafts
// persistence path can use them without pulling in fonts/theme.
// ---------------------------------------------------------------------------

/** Build a TipTap doc JSON fragment from plain text (newlines -> paragraphs). */
export function tiptapFromText(text: string): unknown {
    const lines = text.split('\n')
    return {
        type: 'doc',
        content: lines.map((line) => ({
            type: 'paragraph',
            content: line.length ? [{ type: 'text', text: line }] : [],
        })),
    }
}

/** Flatten a TipTap doc fragment back to plain text. */
export function textFromTiptap(doc: unknown): string {
    const out: string[] = []
    const walk = (node: unknown): void => {
        if (!node || typeof node !== 'object') return
        const n = node as { type?: string; text?: string; content?: unknown[] }
        if (typeof n.text === 'string') out.push(n.text)
        if (Array.isArray(n.content)) {
            n.content.forEach(walk)
            if (n.type === 'paragraph' || n.type === 'heading') out.push('\n')
        }
    }
    walk(doc)
    return out.join('').replace(/\n+$/g, '').trim()
}
