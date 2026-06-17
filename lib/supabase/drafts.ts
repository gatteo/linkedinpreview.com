import type { SupabaseClient } from '@supabase/supabase-js'

import { computeStats, extractTitle, type DraftContent, type DraftManifestEntry, type DraftStatus } from '@/lib/drafts'

// ---------------------------------------------------------------------------
// Row type returned by Supabase
// ---------------------------------------------------------------------------

interface DraftRow {
    id: string
    user_id: string
    title: string
    content: any
    media: any
    status: DraftStatus
    label: string | null
    word_count: number
    char_count: number
    created_at: string
    updated_at: string
    scheduled_at: string | null
    published_at: string | null
    linkedin_post_url: string | null
    publish_error: string | null
}

const ENTRY_COLUMNS =
    'id, title, status, label, word_count, char_count, created_at, updated_at, scheduled_at, published_at, linkedin_post_url, publish_error'

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function rowToEntry(row: DraftRow): DraftManifestEntry {
    return {
        id: row.id,
        title: row.title,
        status: row.status,
        label: row.label ?? null,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
        charCount: row.char_count,
        wordCount: row.word_count,
        scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).getTime() : null,
        publishedAt: row.published_at ? new Date(row.published_at).getTime() : null,
        linkedinPostUrl: row.linkedin_post_url ?? null,
        publishError: row.publish_error ?? null,
    }
}

function rowToContent(row: DraftRow): DraftContent {
    return {
        content: row.content ?? null,
        media: row.media ?? null,
    }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Fetch all drafts for the current user, ordered by updated_at desc.
 */
export async function fetchDrafts(client: SupabaseClient): Promise<DraftManifestEntry[]> {
    const { data, error } = await client.from('drafts').select(ENTRY_COLUMNS).order('updated_at', { ascending: false })

    if (error) throw error
    return (data as DraftRow[]).map(rowToEntry)
}

/**
 * Fetch a single draft by ID, returning both manifest entry and content blob.
 */
export async function fetchDraft(
    client: SupabaseClient,
    id: string,
): Promise<{ entry: DraftManifestEntry; content: DraftContent } | null> {
    const { data, error } = await client.from('drafts').select('*').eq('id', id).single()

    if (error) {
        if (error.code === 'PGRST116') return null // row not found
        throw error
    }

    const row = data as DraftRow
    return { entry: rowToEntry(row), content: rowToContent(row) }
}

/**
 * Create a new draft with optional initial TipTap JSON content.
 */
export async function createDraft(
    client: SupabaseClient,
    userId: string,
    initialContent?: any,
    label?: string | null,
): Promise<DraftManifestEntry> {
    const id = crypto.randomUUID()
    const title = extractTitle(initialContent)
    const stats = computeStats(initialContent)
    const now = new Date().toISOString()

    const { data, error } = await client
        .from('drafts')
        .insert({
            id,
            user_id: userId,
            title,
            content: initialContent ?? null,
            media: null,
            status: 'draft',
            label: label ?? null,
            word_count: stats.wordCount,
            char_count: stats.charCount,
            created_at: now,
            updated_at: now,
        })
        .select(ENTRY_COLUMNS)
        .single()

    if (error) throw error
    return rowToEntry(data as DraftRow)
}

/**
 * Update a draft's content, media, and/or status.
 * Re-computes title and stats when content is provided.
 */
export async function updateDraft(
    client: SupabaseClient,
    id: string,
    updates: { content?: any; media?: any; status?: DraftStatus; label?: string | null },
): Promise<void> {
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }

    if (updates.content !== undefined) {
        patch.content = updates.content
        patch.title = extractTitle(updates.content)
        const stats = computeStats(updates.content)
        patch.word_count = stats.wordCount
        patch.char_count = stats.charCount
    }
    if (updates.media !== undefined) {
        patch.media = updates.media
    }
    if (updates.status !== undefined) {
        patch.status = updates.status
    }
    if (updates.label !== undefined) {
        patch.label = updates.label
    }

    const { error } = await client.from('drafts').update(patch).eq('id', id)
    if (error) throw error
}

/**
 * Delete a draft by ID.
 */
export async function deleteDraft(client: SupabaseClient, id: string): Promise<void> {
    const { error } = await client.from('drafts').delete().eq('id', id)
    if (error) throw error
}

/**
 * Bulk-delete "empty" drafts the user never typed into: no text (char_count 0),
 * no media, still a plain draft that was never scheduled, published, or labelled.
 * These accumulate because the editor eagerly creates a draft on open.
 *
 * `exceptId` spares the draft currently open in the editor. `createdBefore` (ISO
 * timestamp) limits the sweep to drafts created before the current editor
 * session, so a blank draft another tab just created is never swept out from
 * under the user. RLS scopes the delete to the current user's rows. Returns the
 * ids actually deleted so callers can reconcile local state.
 */
export async function deleteEmptyDrafts(
    client: SupabaseClient,
    opts: { exceptId?: string; createdBefore?: string } = {},
): Promise<string[]> {
    let query = client
        .from('drafts')
        .delete()
        .eq('status', 'draft')
        .eq('char_count', 0)
        .is('media', null)
        .is('label', null)
        .is('scheduled_at', null)
        .is('linkedin_post_url', null)
    if (opts.exceptId) query = query.neq('id', opts.exceptId)
    if (opts.createdBefore) query = query.lt('created_at', opts.createdBefore)
    const { data, error } = await query.select('id')
    if (error) throw error
    return (data as { id: string }[] | null)?.map((r) => r.id) ?? []
}

/**
 * Duplicate a draft. Returns the new manifest entry, or null if source not found.
 */
export async function duplicateDraft(
    client: SupabaseClient,
    userId: string,
    id: string,
): Promise<DraftManifestEntry | null> {
    const source = await fetchDraft(client, id)
    if (!source) return null

    const newId = crypto.randomUUID()
    const now = new Date().toISOString()

    const { data, error } = await client
        .from('drafts')
        .insert({
            id: newId,
            user_id: userId,
            title: source.entry.title,
            content: source.content.content,
            media: source.content.media,
            status: 'draft',
            label: source.entry.label ?? null,
            word_count: source.entry.wordCount,
            char_count: source.entry.charCount,
            created_at: now,
            updated_at: now,
        })
        .select(ENTRY_COLUMNS)
        .single()

    if (error) throw error
    return rowToEntry(data as DraftRow)
}

// ---------------------------------------------------------------------------
// Scheduling & publishing state transitions
// ---------------------------------------------------------------------------

/**
 * Schedule a draft for a future time (or unschedule when `scheduledAtMs` is null).
 * Clears any prior publish error and resets retry bookkeeping.
 */
export async function setDraftSchedule(
    client: SupabaseClient,
    id: string,
    scheduledAtMs: number | null,
): Promise<void> {
    const patch =
        scheduledAtMs === null
            ? { status: 'draft', scheduled_at: null, updated_at: new Date().toISOString() }
            : {
                  status: 'scheduled',
                  scheduled_at: new Date(scheduledAtMs).toISOString(),
                  publish_error: null,
                  publish_attempts: 0,
                  publish_lock_at: null,
                  updated_at: new Date().toISOString(),
              }
    const { error } = await client.from('drafts').update(patch).eq('id', id)
    if (error) throw error
}

/** Mark a draft as published to LinkedIn. */
export async function markDraftPublished(
    client: SupabaseClient,
    id: string,
    result: { urn: string; url: string },
): Promise<void> {
    const now = new Date().toISOString()
    const { error } = await client
        .from('drafts')
        .update({
            status: 'published',
            published_at: now,
            scheduled_at: null,
            linkedin_post_urn: result.urn,
            linkedin_post_url: result.url,
            publish_error: null,
            publish_lock_at: null,
            updated_at: now,
        })
        .eq('id', id)
    if (error) throw error
}

/**
 * Record a failed publish. Transient failures keep the draft `scheduled` (the
 * cron retries after the lock window); permanent failures move it to `failed`.
 */
export async function markDraftPublishFailed(
    client: SupabaseClient,
    id: string,
    message: string,
    opts: { permanent: boolean },
): Promise<void> {
    const patch: Record<string, any> = { publish_error: message, updated_at: new Date().toISOString() }
    if (opts.permanent) {
        patch.status = 'failed'
        patch.publish_lock_at = null
    }
    const { error } = await client.from('drafts').update(patch).eq('id', id)
    if (error) throw error
}
