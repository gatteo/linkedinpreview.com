import { readDraftMedia, type StoredMedia } from '@/lib/draft-media'
import { decodeDraft } from '@/lib/draft-url'

export function isDraftDocument(value: unknown): boolean {
    const doc = value as { type?: unknown; content?: unknown }
    const validNodes = (nodes: unknown[]): boolean =>
        nodes.every((value) => {
            if (!value || typeof value !== 'object') return false
            const node = value as { type?: unknown; text?: unknown; content?: unknown }
            return (
                typeof node.type === 'string' &&
                (node.text === undefined || typeof node.text === 'string') &&
                (node.content === undefined || (Array.isArray(node.content) && validNodes(node.content)))
            )
        })
    return !!doc && doc.type === 'doc' && Array.isArray(doc.content) && validNodes(doc.content)
}

export async function importDraft<T>(
    encoded: string,
    mediaKey: string | null,
    create: (content: any, options: { media: StoredMedia | null }) => Promise<T>,
): Promise<{ draft: T; content: any; media: StoredMedia | null }> {
    const content = await decodeDraft(encoded)
    if (!isDraftDocument(content)) throw new Error('Invalid draft import')
    const media = mediaKey ? await readDraftMedia(mediaKey) : null
    if (mediaKey && !media) throw new Error('Draft media unavailable')
    const draft = await create(content, { media })
    return { draft, content, media }
}
