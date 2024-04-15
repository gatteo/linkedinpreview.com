interface Node {
    type: string
    content?: Node[]
    text?: string
}

function toText(node: Node): string {
    if (node.type === 'hardBreak') {
        return '\n'
    } else if (node.type === 'text') {
        // If it's a text node, return the text content
        return node.text || ''
    } else if (node.content) {
        // If it's a parent node, recursively process its children
        return node.content.map((childNode) => toText(childNode)).join('')
    } else {
        // If it's not a text node and has no children, return an empty string
        return ''
    }
}

export function toPlainText(json: Node[]): string {
    // Iterate over each block in the JSON content
    let plainText = ''

    for (let i = 0; i < json.length; i++) {
        const block = json[i]
        const text = toText(block)

        if (block.type === 'paragraph' && !text.trim()) {
            // If it's a paragraph block with no content, add a block separator '\n\n'
            plainText += '\n\n'
        } else {
            // If it's not the last block and the next block is a paragraph with content, add a block separator '\n\n'
            if (
                i !== json.length - 1 &&
                json[i + 1].type === 'paragraph' &&
                json[i + 1].content?.some((item) => item.type === 'text')
            ) {
                plainText += text + '\n'
            } else {
                plainText += text
            }
        }
    }
    return plainText
}
