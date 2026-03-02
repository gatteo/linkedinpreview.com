// ---------------------------------------------------------------------------
// Draft schema
// ---------------------------------------------------------------------------

export type DraftStatus = 'draft' | 'scheduled' | 'published'

export interface Draft {
    /** Unique identifier (UUID v4) */
    id: string
    /** TipTap JSON document */
    content: any
    /** Auto-generated from first line of content, truncated to 60 chars */
    title: string
    /** Post status */
    status: DraftStatus
    /** Unix timestamp (ms) when the draft was created */
    createdAt: number
    /** Unix timestamp (ms) when the draft was last modified */
    updatedAt: number
    /** Total character count of plain-text content */
    charCount: number
    /** Total word count */
    wordCount: number
    /** Media attachment (image/video as data URL), NOT stored in manifest */
    media: { type: 'image' | 'video'; src: string } | null
}

/** Lightweight entry stored in the manifest (no content/media blobs) */
export interface DraftManifestEntry {
    id: string
    title: string
    status: DraftStatus
    label: string | null
    createdAt: number
    updatedAt: number
    charCount: number
    wordCount: number
}

// ---------------------------------------------------------------------------
// Post labels
// ---------------------------------------------------------------------------

export const POST_LABELS = [
    'Personal Milestones',
    'Mindset & Motivation',
    'Career Before & After',
    'Tool & Resource Insights',
    'Case Studies',
    'Actionable Guides',
    'Culture Moments',
    'Offer Highlight',
    'Client Success Story',
] as const

export type PostLabel = (typeof POST_LABELS)[number]

/** Full content blob stored per-draft */
export interface DraftContent {
    content: any // TipTap JSON
    media: { type: 'image' | 'video'; src: string } | null
}

export interface ExportData {
    version: 1
    exportedAt: string
    manifest: DraftManifestEntry[]
    drafts: Record<string, DraftContent>
    branding: any // raw branding JSON
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a title from TipTap JSON - text from the first paragraph, truncated to 60 chars.
 */
export function extractTitle(content: any): string {
    if (!content?.content) return 'Untitled'
    for (const node of content.content) {
        if (node.content) {
            const text = node.content
                .map((child: any) => child.text || '')
                .join('')
                .trim()
            if (text) {
                return text.length > 60 ? text.slice(0, 57) + '...' : text
            }
        }
    }
    return 'Untitled'
}

/** Compute character and word count from TipTap JSON */
export function computeStats(content: any): { charCount: number; wordCount: number } {
    if (!content?.content) return { charCount: 0, wordCount: 0 }

    let text = ''
    function walk(nodes: any[]) {
        for (const node of nodes) {
            if (node.text) text += node.text
            if (node.content) walk(node.content)
            if (node.type === 'paragraph' || node.type === 'listItem') text += '\n'
        }
    }
    walk(content.content)

    const trimmed = text.trim()
    return {
        charCount: trimmed.length,
        wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
    }
}
