import { readDraftMedia, type StoredMedia } from '@/lib/draft-media'
import { decodeDraft } from '@/lib/draft-url'

const FAILURE_STAGES = ['decode_validation', 'media_read', 'create', 'post_create', 'unknown'] as const

export type DraftImportDiagnostics = {
    failure_stage: (typeof FAILURE_STAGES)[number]
    create_resolved: boolean
}

export function draftImportFailureProperties(diagnostics?: DraftImportDiagnostics) {
    return {
        diagnostic_schema_version: 1,
        failure_stage:
            diagnostics && FAILURE_STAGES.includes(diagnostics.failure_stage) ? diagnostics.failure_stage : 'unknown',
        create_resolved: diagnostics?.create_resolved === true,
    }
}

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
    diagnostics?: DraftImportDiagnostics,
): Promise<{ draft: T; content: any; media: StoredMedia | null }> {
    if (diagnostics) diagnostics.failure_stage = 'decode_validation'
    const content = await decodeDraft(encoded)
    if (!isDraftDocument(content)) throw new Error('Invalid draft import')
    if (diagnostics && mediaKey) diagnostics.failure_stage = 'media_read'
    const media = mediaKey ? await readDraftMedia(mediaKey) : null
    if (mediaKey && !media) throw new Error('Draft media unavailable')
    if (diagnostics) diagnostics.failure_stage = 'create'
    const draft = await create(content, { media })
    if (diagnostics) {
        diagnostics.create_resolved = true
        diagnostics.failure_stage = 'post_create'
    }
    return { draft, content, media }
}
