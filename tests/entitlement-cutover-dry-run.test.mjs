import assert from 'node:assert/strict'
import test from 'node:test'

import { validateEntitlementCutoverDryRun } from '../lib/billing/entitlement-cutover-validator.ts'
import { cloneSyntheticEntitlementCutoverManifest } from './fixtures/entitlement-cutover-dry-run.synthetic.mjs'

test('accounts for the complete synthetic recovery cohort deterministically', () => {
    const report = validateEntitlementCutoverDryRun(cloneSyntheticEntitlementCutoverManifest())

    assert.equal(report.gate, 'pass')
    assert.deepEqual(report.totals, {
        sourceRecords: 17,
        verifiedPaidRecords: 15,
        grandfatheredExceptions: 1,
        staleTestRows: 1,
        eligibleImports: 15,
        alreadyLedgered: 0,
        preservedLegacyExceptions: 1,
        excludedStaleRows: 1,
    })
    assert.deepEqual(report.coverage, {
        accountedVerifiedPaidRecords: 15,
        expectedVerifiedPaidRecords: 15,
    })
    assert.deepEqual(report.counters, {
        missingImmutableProofs: 0,
        duplicateGrantCandidates: 0,
        staleTestImports: 0,
        formerOwnerRegrants: 0,
        unexplainedPaidToFreeDifferences: 0,
        identityAmbiguities: 0,
    })
    assert.equal(report.importRecordIds.length, 15)
    assert.deepEqual(report.preservedLegacyRecordIds, ['synthetic-grandfathered-lifetime'])
    assert.deepEqual(report.excludedRecordIds, ['synthetic-stale-test-pro'])
    assert.deepEqual(report.errors, [])
})

test('fails closed when a verified paid record lacks canonical immutable proof', () => {
    const manifest = cloneSyntheticEntitlementCutoverManifest()
    manifest.records[0].canonical.paymentStatus = 'unpaid'

    const report = validateEntitlementCutoverDryRun(manifest)

    assert.equal(report.gate, 'fail')
    assert.equal(report.coverage.accountedVerifiedPaidRecords, 14)
    assert.equal(report.counters.missingImmutableProofs, 1)
})

test('fails closed on duplicate grant identities', () => {
    const manifest = cloneSyntheticEntitlementCutoverManifest()
    manifest.records[1].canonical.checkoutSessionId = manifest.records[0].canonical.checkoutSessionId

    const report = validateEntitlementCutoverDryRun(manifest)

    assert.equal(report.gate, 'fail')
    assert.equal(report.counters.duplicateGrantCandidates, 1)
    assert.match(report.errors[0], /duplicate checkout session/)
})

test('fails closed rather than importing the stale test row', () => {
    const manifest = cloneSyntheticEntitlementCutoverManifest()
    const stale = manifest.records.find((record) => record.classification === 'stale_test')
    stale.proposedAction = 'import'

    const report = validateEntitlementCutoverDryRun(manifest)

    assert.equal(report.gate, 'fail')
    assert.equal(report.counters.staleTestImports, 1)
})

test('fails closed if the grandfathered exception would lose legacy access', () => {
    const manifest = cloneSyntheticEntitlementCutoverManifest()
    const grandfathered = manifest.records.find((record) => record.classification === 'grandfathered_non_revenue')
    grandfathered.legacy.authorized = false

    const report = validateEntitlementCutoverDryRun(manifest)

    assert.equal(report.gate, 'fail')
    assert.equal(report.counters.unexplainedPaidToFreeDifferences, 1)
})

test('fails closed instead of regranting a transferred entitlement to its former owner', () => {
    const manifest = cloneSyntheticEntitlementCutoverManifest()
    const record = manifest.records[0]
    record.existingLedger = {
        checkoutSessionId: record.canonical.checkoutSessionId,
        originOwnerId: record.canonical.ownerId,
        ownerId: '00000000-0000-4000-8000-999999999999',
        plan: record.canonical.plan,
        status: 'active',
    }

    const report = validateEntitlementCutoverDryRun(manifest)

    assert.equal(report.gate, 'fail')
    assert.equal(report.counters.formerOwnerRegrants, 1)
    assert.equal(report.counters.unexplainedPaidToFreeDifferences, 1)
})

test('accepts an exactly matching already-ledgered identity without a duplicate import', () => {
    const manifest = cloneSyntheticEntitlementCutoverManifest()
    const record = manifest.records[0]
    record.existingLedger = {
        checkoutSessionId: record.canonical.checkoutSessionId,
        originOwnerId: record.canonical.ownerId,
        ownerId: record.canonical.ownerId,
        plan: record.canonical.plan,
        status: 'active',
    }
    record.proposedAction = 'already_ledgered'

    const report = validateEntitlementCutoverDryRun(manifest)

    assert.equal(report.gate, 'pass')
    assert.equal(report.coverage.accountedVerifiedPaidRecords, 15)
    assert.equal(report.totals.eligibleImports, 14)
    assert.equal(report.totals.alreadyLedgered, 1)
})
