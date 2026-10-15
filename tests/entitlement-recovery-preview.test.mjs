import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
    evaluateSyntheticRecoveryCode,
    handleEntitlementRecoveryPreview,
    isEntitlementRecoveryPreviewAvailable,
} from '../lib/billing/entitlement-recovery-preview.ts'
import { syntheticEntitlementCutoverManifest } from './fixtures/entitlement-cutover-dry-run.synthetic.mjs'

function previewRequest(recoveryCode) {
    return new Request('http://localhost/api/billing/recovery/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recoveryCode }),
    })
}

test('restores every verified paid fixture with complete cohort coverage', () => {
    const verifiedPaidRecords = syntheticEntitlementCutoverManifest.records.filter(
        (record) => record.classification === 'verified_paid',
    )
    const results = verifiedPaidRecords.map((record) => ({
        expectedPlan: record.legacy.plan,
        result: evaluateSyntheticRecoveryCode(record.recordId.replace('synthetic-paid-', 'verified-paid-')),
    }))

    assert.equal(results.length, syntheticEntitlementCutoverManifest.expected.verifiedPaidRecords)
    assert.equal(results.filter(({ result }) => result.plan === 'lifetime').length, 12)
    assert.equal(results.filter(({ result }) => result.plan === 'pro').length, 3)
    for (const { expectedPlan, result } of results) {
        assert.equal(result.outcome, 'verified_paid_restored')
        assert.equal(result.classification, 'verified_paid')
        assert.equal(result.plan, expectedPlan)
        assert.equal(result.restored, true)
        assert.equal(result.accessPreserved, true)
        assert.equal(result.paidImportSimulated, true)
        assert.equal(result.grant, 'simulated_restore')
        assert.equal(result.writesPerformed, false)
    }
})

test('preserves the grandfathered exception without importing it as paid', () => {
    const grandfatheredRecords = syntheticEntitlementCutoverManifest.records.filter(
        (record) => record.classification === 'grandfathered_non_revenue',
    )
    assert.equal(grandfatheredRecords.length, syntheticEntitlementCutoverManifest.expected.grandfatheredExceptions)
    const result = evaluateSyntheticRecoveryCode(grandfatheredRecords[0].recordId.replace('synthetic-', ''))

    assert.deepEqual(result, {
        mode: 'synthetic_preview',
        outcome: 'grandfathered_preserved',
        classification: 'grandfathered_non_revenue',
        plan: 'lifetime',
        restored: false,
        accessPreserved: true,
        paidImportSimulated: false,
        grant: 'legacy_fallback',
        writesPerformed: false,
        message: 'Existing lifetime access stays preserved. No paid entitlement is imported.',
    })
})

test('rejects the stale test-mode Pro fixture with no grant', () => {
    const staleTestRecords = syntheticEntitlementCutoverManifest.records.filter(
        (record) => record.classification === 'stale_test',
    )
    assert.equal(staleTestRecords.length, syntheticEntitlementCutoverManifest.expected.staleTestRows)
    const result = evaluateSyntheticRecoveryCode(staleTestRecords[0].recordId.replace('synthetic-', ''))

    assert.equal(result.outcome, 'stale_test_rejected')
    assert.equal(result.classification, 'stale_test')
    assert.equal(result.restored, false)
    assert.equal(result.accessPreserved, false)
    assert.equal(result.paidImportSimulated, false)
    assert.equal(result.grant, 'none')
    assert.equal(result.writesPerformed, false)
})

test('rejects an unpaid or unknown fixture with no grant', () => {
    const result = evaluateSyntheticRecoveryCode('unknown-purchase')

    assert.equal(result.outcome, 'unknown_rejected')
    assert.equal(result.classification, 'unknown')
    assert.equal(result.restored, false)
    assert.equal(result.accessPreserved, false)
    assert.equal(result.paidImportSimulated, false)
    assert.equal(result.grant, 'none')
    assert.equal(result.writesPerformed, false)
})

test('exposes the synthetic route only in preview or development environments', () => {
    assert.equal(isEntitlementRecoveryPreviewAvailable({ VERCEL_ENV: 'preview', NODE_ENV: 'production' }), true)
    assert.equal(isEntitlementRecoveryPreviewAvailable({ NODE_ENV: 'development' }), true)
    assert.equal(isEntitlementRecoveryPreviewAvailable({ VERCEL_ENV: 'production', NODE_ENV: 'production' }), false)
    assert.equal(isEntitlementRecoveryPreviewAvailable({ NODE_ENV: 'production' }), false)
})

test('keeps the route inert when the preview gate is off', async () => {
    const response = await handleEntitlementRecoveryPreview(previewRequest('verified-paid-01'), false)

    assert.equal(response.status, 404)
    assert.deepEqual(await response.json(), { error: 'Not found' })
})

test('returns only synthetic outcomes and performs no write for all fixture classes', async () => {
    const expected = new Map([
        ['verified-paid-01', 'verified_paid_restored'],
        ['grandfathered-lifetime', 'grandfathered_preserved'],
        ['stale-test-pro', 'stale_test_rejected'],
        ['unknown-purchase', 'unknown_rejected'],
    ])

    for (const [recoveryCode, outcome] of expected) {
        const response = await handleEntitlementRecoveryPreview(previewRequest(recoveryCode), true)
        const result = await response.json()
        assert.equal(response.status, 200)
        assert.equal(result.outcome, outcome)
        assert.equal(result.writesPerformed, false)
    }
})

test('rejects malformed input before fixture evaluation', async () => {
    const response = await handleEntitlementRecoveryPreview(
        new Request('http://localhost/api/billing/recovery/preview', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ recoveryCode: 'not an allowed code' }),
        }),
        true,
    )

    assert.equal(response.status, 400)
    assert.deepEqual(await response.json(), { error: 'Invalid recovery request' })
})

test('preview surface contains no Stripe, Supabase, secret or PII path', async () => {
    const [route, page, component] = await Promise.all([
        readFile(new URL('../app/api/billing/recovery/preview/route.ts', import.meta.url), 'utf8'),
        readFile(new URL('../app/(main)/entitlement-recovery-preview/page.tsx', import.meta.url), 'utf8'),
        readFile(new URL('../components/billing/entitlement-recovery-preview.tsx', import.meta.url), 'utf8'),
    ])

    assert.doesNotMatch(route, /stripe|supabase|createAdminClient|service_role|BILLING_EMAIL_HMAC_KEY/i)
    assert.doesNotMatch(page, /stripe|supabase|createAdminClient|service_role|BILLING_EMAIL_HMAC_KEY/i)
    assert.match(component, /entitlement_recovery_attempted/)
    assert.match(component, /entitlement_recovery_succeeded/)
    assert.doesNotMatch(component, /posthog\?\.capture\([^)]*(email|recoveryCode|userId)/s)
})
