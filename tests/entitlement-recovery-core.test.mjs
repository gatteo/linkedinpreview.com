import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')

test('records checkout ownership by immutable session before deriving billing', () => {
    const migrationPath = 'supabase/migrations/027_entitlement_recovery.sql'
    assert.equal(existsSync(join(root, migrationPath)), true, `${migrationPath} must exist`)

    const migration = read(migrationPath)
    assert.match(migration, /create table public\.billing_entitlements/i)
    assert.match(migration, /stripe_checkout_session_id\s+text\s+not null\s+unique/i)
    assert.match(migration, /origin_user_id\s+uuid\s+not null/i)
    assert.match(migration, /owner_user_id\s+uuid\s+not null/i)
    assert.match(migration, /create table public\.billing_entitlement_assignments/i)
    assert.match(migration, /create table public\.stripe_webhook_events/i)
    assert.match(migration, /create or replace function public\.record_stripe_entitlement/i)
    assert.match(migration, /create or replace function public\.claim_entitlement/i)
})
