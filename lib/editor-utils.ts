/**
 * Check if a TipTap JSON document has actual text content.
 */
export function hasTextContent(doc: any): boolean {
    if (!doc?.content) return false
    return doc.content.some((node: any) => {
        if (node.content) {
            return node.content.some((child: any) => child.text?.trim())
        }
        return false
    })
}

/**
 * Extract plain text from a TipTap JSON document.
 */
export function extractPlainText(content: any): string {
    if (!content?.content) return ''
    let text = ''
    function walk(nodes: any[]) {
        for (const node of nodes) {
            if (node.text) text += node.text
            if (node.content) walk(node.content)
            if (node.type === 'paragraph' || node.type === 'listItem') text += '\n'
        }
    }
    walk(content.content)
    return text.trim()
}

/**
 * Convert plain text into a minimal TipTap JSON document.
 */
export function textToTipTapJson(text: string) {
    const paragraphs = text.split(/\n\n+/).filter(Boolean)
    return {
        type: 'doc',
        content: paragraphs.map((p) => ({
            type: 'paragraph',
            content: [{ type: 'text', text: p.replace(/\n/g, ' ') }],
        })),
    }
}
