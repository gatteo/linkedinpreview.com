import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'

const MIGRATION_KEY = 'lp-migrated-to-supabase'

export async function migrateLocalStorage(client: ReturnType<typeof createClient>, uid: string) {
    if (localStorage.getItem(MIGRATION_KEY)) return

    try {
        // Migrate drafts
        const manifestRaw = localStorage.getItem('lp-drafts-manifest')
        if (manifestRaw) {
            const manifest = JSON.parse(manifestRaw) as Array<any>
            for (const entry of manifest) {
                const contentRaw = localStorage.getItem(`lp-draft-${entry.id}`)
                const content = contentRaw ? JSON.parse(contentRaw) : null

                const { data: existing } = await client.from('drafts').select('id').eq('id', entry.id).maybeSingle()

                if (!existing) {
                    await client.from('drafts').insert({
                        id: entry.id,
                        user_id: uid,
                        title: entry.title || 'Untitled',
                        content: content?.content ?? null,
                        media: content?.media ?? null,
                        status: entry.status || 'draft',
                        word_count: entry.wordCount || 0,
                        char_count: entry.charCount || 0,
                        created_at: new Date(entry.createdAt || Date.now()).toISOString(),
                        updated_at: new Date(entry.updatedAt || Date.now()).toISOString(),
                    })
                }
            }
        }

        // Migrate branding
        const brandingRaw = localStorage.getItem('lp-branding')
        if (brandingRaw) {
            const brandingData = JSON.parse(brandingRaw)
            await client.from('branding').upsert(
                {
                    user_id: uid,
                    data: brandingData,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' },
            )
        }

        localStorage.setItem(MIGRATION_KEY, '1')
    } catch {
        toast.error('Failed to migrate local data')
    }
}
