import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

const root = resolve(import.meta.dirname, '..')

async function source(path) {
    return readFile(resolve(root, path), 'utf8')
}

test('EXP-6 rollback removes the capture surface without changing the full-post copy path', async () => {
    const editor = await source('components/tool/editor-panel.tsx')

    assert.doesNotMatch(editor, /EmailCapture|showLeadCapture|setShowLeadCapture/)
    assert.match(
        editor,
        /posthog\.capture\('post_copied', getPostAnalytics\(json, text, !!currentMedia\)\)\s+analyzePost\(json, text\)/,
    )
})

test('EXP-6 rollback rejects every lead request before parsing, authentication, or persistence', async () => {
    const route = await source('app/api/leads/route.ts')

    assert.match(route, /export function POST\(\)/)
    assert.match(route, /status: 410/)
    assert.doesNotMatch(route, /request\.json|createClient|createAdminClient|capture_consent_lead|captured: true/)
})

test('EXP-6 migration makes email dedupe atomic and denies direct client access', async () => {
    const migration = await source('supabase/migrations/031_leads.sql')

    assert.match(migration, /create table public\.leads/)
    assert.match(migration, /email_normalized text not null unique/)
    assert.match(migration, /consented_at timestamptz not null/)
    assert.match(migration, /consent_version text not null/)
    assert.match(migration, /source text not null check \(source = 'free_tool_post_copy'\)/)
    assert.match(migration, /alter table public\.leads enable row level security/)
    assert.match(migration, /lead_capture_attempts/)
    assert.match(migration, /create function public\.capture_consent_lead/)
    assert.match(migration, /pg_advisory_xact_lock/)
    assert.match(migration, /revoke all on table public\.leads from anon, authenticated/)
    assert.match(migration, /revoke all on table public\.lead_capture_attempts from anon, authenticated/)
    assert.match(migration, /revoke execute on function public\.capture_consent_lead[^;]+ from public/)
    assert.match(migration, /revoke execute on function public\.capture_consent_lead[^;]+ from anon, authenticated/)
    assert.match(migration, /grant execute on function public\.capture_consent_lead[^;]+ to service_role/)
})
