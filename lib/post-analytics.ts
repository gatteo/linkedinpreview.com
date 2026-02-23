/**
 * Extract analytics properties from a TipTap JSON document and its plain text.
 * Used to enrich the `post_copied` PostHog event.
 */
export function getPostAnalytics(json: any, plainText: string, hasImage: boolean) {
    const marks = new Set<string>()
    const nodeTypes = new Set<string>()

    function walk(node: any) {
        if (node.type) nodeTypes.add(node.type)
        if (node.marks) {
            for (const mark of node.marks) marks.add(mark.type)
        }
        if (node.content) {
            for (const child of node.content) walk(child)
        }
    }
    walk(json)

    const formattingTypes = [...marks]
    const hashtagCount = (plainText.match(/#\w+/g) || []).length
    const emojiCount = (plainText.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu) || []).length
    const lineCount = plainText.split('\n').filter((l) => l.trim()).length

    return {
        content: plainText,
        content_length: plainText.length,
        has_formatting: formattingTypes.length > 0,
        formatting_types: formattingTypes,
        has_bullet_list: nodeTypes.has('bulletList'),
        has_ordered_list: nodeTypes.has('orderedList'),
        has_image: hasImage,
        hashtag_count: hashtagCount,
        emoji_count: emojiCount,
        line_count: lineCount,
        language: navigator.language,
    }
}
