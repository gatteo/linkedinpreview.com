/**
 * Segment of text with optional bold/italic marks.
 */
interface Segment {
    text: string
    bold: boolean
    italic: boolean
}

/**
 * Parse a single line of text containing **bold** and *italic* markers
 * into an array of segments with their formatting flags.
 */
function parseSegments(line: string): Segment[] {
    const segments: Segment[] = []
    // Match **bold**, *italic*, or plain text (non-greedy, handles nesting)
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|([^*]+|\*)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(line)) !== null) {
        if (match[2] != null) {
            // **bold**
            segments.push({ text: match[2], bold: true, italic: false })
        } else if (match[4] != null) {
            // *italic*
            segments.push({ text: match[4], bold: false, italic: true })
        } else if (match[5] != null) {
            // plain text
            segments.push({ text: match[5], bold: false, italic: false })
        }
    }

    return segments
}

// ── TipTap JSON ──────────────────────────────────────────────

interface TipTapMark {
    type: string
}

interface TipTapTextNode {
    type: 'text'
    text: string
    marks?: TipTapMark[]
}

interface TipTapParagraph {
    type: 'paragraph'
    content?: TipTapTextNode[]
}

/**
 * Convert a formatted text string (with **bold** and *italic* markers)
 * into TipTap JSON paragraphs ready for `editor.commands.setContent()`.
 */
export function toTipTapParagraphs(text: string): TipTapParagraph[] {
    return text.split('\n').map((line) => {
        if (!line) return { type: 'paragraph' as const }

        const segments = parseSegments(line)
        const content: TipTapTextNode[] = segments
            .filter((s) => s.text)
            .map((s) => {
                const marks: TipTapMark[] = []
                if (s.bold) marks.push({ type: 'bold' })
                if (s.italic) marks.push({ type: 'italic' })
                const node: TipTapTextNode = { type: 'text', text: s.text }
                if (marks.length > 0) node.marks = marks
                return node
            })

        return content.length > 0 ? { type: 'paragraph' as const, content } : { type: 'paragraph' as const }
    })
}
