import { processNodes, toPlainText } from '@/components/tool/utils'

/**
 * Serialize a TipTap JSON document to the exact LinkedIn-ready text the editor's
 * "Copy Text" produces - Unicode bold/italic/underline plus bullet/number lists.
 * Pure (no DOM), so it is safe in API routes and the cron publisher.
 */
export function tiptapToLinkedInText(doc: any): string {
    if (!doc?.content) return ''
    const processed = processNodes(doc) as { content?: any[] }
    return toPlainText(processed.content ?? [])
}
