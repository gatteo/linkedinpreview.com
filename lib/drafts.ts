// ---------------------------------------------------------------------------
// Draft schema
// ---------------------------------------------------------------------------

export type DraftStatus = 'draft' | 'scheduled' | 'published' | 'failed'

/**
 * Manual status labels offered in the editor's status picker. `failed` is a
 * system-set state (a scheduled publish that could not be delivered) and is never
 * a manual choice, so it is intentionally excluded here.
 */
export const STATUS_OPTIONS: { label: string; value: DraftStatus }[] = [
    { label: 'Draft', value: 'draft' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Published', value: 'published' },
]

/** Display label for every status, including the system-set `failed`. */
export const STATUS_LABELS: Record<DraftStatus, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    published: 'Published',
    failed: 'Failed',
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
    scheduledAt: number | null
    publishedAt: number | null
    linkedinPostUrl: string | null
    publishError: string | null
}

// ---------------------------------------------------------------------------
// Post formats
// ---------------------------------------------------------------------------

export const POST_FORMATS = [
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

export type PostFormat = (typeof POST_FORMATS)[number]

/** @deprecated Use POST_FORMATS */
export const POST_LABELS = POST_FORMATS
/** @deprecated Use PostFormat */
export type PostLabel = PostFormat

/** Full content blob stored per-draft */
export interface DraftContent {
    content: any // TipTap JSON
    media: { type: 'image' | 'video'; src: string } | null
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
