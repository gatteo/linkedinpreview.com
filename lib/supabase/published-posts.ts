import type { SupabaseClient } from '@supabase/supabase-js'

import { tiptapToLinkedInText } from '@/lib/linkedin/serialize'

// ---------------------------------------------------------------------------
// Published posts WITH their content body. The drafts manifest deliberately
// omits the (potentially large) content blob; the analytics correlation engine
// needs the actual text to extract content features, so this fetches the bodies
// for published posts only.
// ---------------------------------------------------------------------------

export interface PublishedPostContent {
    id: string
    plainText: string
    hasMedia: boolean
    charCount: number
    wordCount: number
    label: string | null
    publishedAt: number
}

interface Row {
    id: string
    content: any
    media: any
    char_count: number
    word_count: number
    label: string | null
    published_at: string | null
    created_at: string
}

const COLUMNS = 'id, content, media, char_count, word_count, label, published_at, created_at'

/** Fetch every published post's content, keyed by id, for feature analysis. */
export async function fetchPublishedPostsContent(client: SupabaseClient): Promise<Map<string, PublishedPostContent>> {
    const { data, error } = await client.from('drafts').select(COLUMNS).eq('status', 'published')
    if (error) throw error

    const byId = new Map<string, PublishedPostContent>()
    for (const row of (data as Row[]) ?? []) {
        byId.set(row.id, {
            id: row.id,
            plainText: tiptapToLinkedInText(row.content),
            hasMedia: row.media != null,
            charCount: row.char_count,
            wordCount: row.word_count,
            label: row.label,
            publishedAt: row.published_at ? new Date(row.published_at).getTime() : new Date(row.created_at).getTime(),
        })
    }
    return byId
}
