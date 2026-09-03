import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

const root = resolve(import.meta.dirname, '..')

async function source(path) {
    return readFile(resolve(root, path), 'utf8')
}

test('EXP-6 shows capture only after a successful full-post copy', async () => {
    const editor = await source('components/tool/editor-panel.tsx')

    assert.match(editor, /import \{ EmailCapture \} from '@\/components\/tool\/email-capture'/)
    assert.match(editor, /const \[showLeadCapture, setShowLeadCapture\] = React\.useState\(false\)/)
    assert.match(
        editor,
        /posthog\.capture\('post_copied', getPostAnalytics\(json, text, !!currentMedia\)\)[\s\S]*setShowLeadCapture\(true\)/,
    )
    assert.match(editor, /showLeadCapture && <EmailCapture onDismiss=\{\(\) => setShowLeadCapture\(false\)\} \/>/)
})

test('EXP-6 capture form requires explicit consent and durable success before analytics', async () => {
    const capture = await source('components/tool/email-capture.tsx')

    assert.match(capture, /const \[consent, setConsent\] = React\.useState\(false\)/)
    assert.match(capture, /checked=\{consent\}/)
    assert.match(capture, /if \(!EMAIL_RE\.test\(normalizedEmail\)\)/)
    assert.match(capture, /if \(!consent\)/)
    assert.match(capture, /const authenticated = await ensureSession\(\)/)
    assert.match(capture, /if \(!authenticated\) \{[\s\S]*setSubmitting\(false\)[\s\S]*return/)
    assert.match(
        capture,
        /if \(data\.captured\) posthog\.capture\('lead_captured', \{ source: 'free_tool_post_copy' \}\)/,
    )
    assert.doesNotMatch(capture, /auth\.updateUser/)
})

test('EXP-6 session setup fails closed before a lead request', async () => {
    const auth = await source('hooks/use-anonymous-auth.ts')

    assert.match(auth, /if \(isReady\) return true/)
    assert.match(auth, /if \(session\) \{[\s\S]*return true/)
    assert.match(auth, /if \(error \|\| !data\.session\) \{[\s\S]*return false/)
    assert.match(auth, /setIsReady\(true\)[\s\S]*return true/)
    assert.match(auth, /try \{[\s\S]*signInAnonymously\(\)[\s\S]*\} catch \{[\s\S]*return false/)
})

test('EXP-6 route derives identity and consent audit fields server-side', async () => {
    const route = await source('app/api/leads/route.ts')
    const schema = await source('app/api/leads/route.schema.ts')

    assert.match(route, /assertStrictSameOrigin\(request\)/)
    assert.match(route, /url\.protocol !== 'https:'/)
    assert.match(route, /x-vercel-forwarded-for/)
    assert.match(route, /createHash\('sha256'\)/)
    assert.match(route, /rpc\('capture_consent_lead'/)
    assert.match(route, /supabase\.auth\.getUser\(\)/)
    assert.match(route, /createAdminClient\(\)/)
    assert.match(route, /p_consented_at: new Date\(\)\.toISOString\(\)/)
    assert.match(route, /p_consent_version: LEAD_CONSENT_VERSION/)
    assert.match(route, /p_source: 'free_tool_post_copy'/)
    assert.match(route, /result === 'created'/)
    assert.doesNotMatch(route, /captureServer/)
    assert.match(schema, /marketingConsent: z\.literal\(true\)/)
    assert.doesNotMatch(schema, /userId|consentedAt|consentVersion|source/)
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
