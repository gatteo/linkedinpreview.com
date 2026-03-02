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
