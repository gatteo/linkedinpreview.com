export type CutoverPlan = 'pro' | 'lifetime'
export type CutoverClassification = 'verified_paid' | 'grandfathered_non_revenue' | 'stale_test'
export type CutoverAction = 'import' | 'already_ledgered' | 'legacy_fallback' | 'exclude'

export interface CutoverCanonicalEvidence {
    checkoutSessionId: string
    ownerId: string
    plan: CutoverPlan
    livemode: boolean
    paymentStatus: 'paid' | 'unpaid'
    amountTotal: number
    status: 'active' | 'inactive' | 'refunded' | 'disputed'
    evidenceDigest: string
}

export interface CutoverLedgerIdentity {
    checkoutSessionId: string
    originOwnerId: string
    ownerId: string
    plan: CutoverPlan
    status: 'active' | 'inactive' | 'refunded' | 'disputed'
}

export interface EntitlementCutoverRecord {
    recordId: string
    classification: CutoverClassification
    legacy: {
        ownerId: string
        plan: CutoverPlan
        authorized: boolean
    }
    canonical: CutoverCanonicalEvidence | null
    existingLedger: CutoverLedgerIdentity | null
    proposedAction: CutoverAction
}

export interface EntitlementCutoverManifest {
    version: 1
    expected: {
        verifiedPaidRecords: number
        grandfatheredExceptions: number
        staleTestRows: number
    }
    records: EntitlementCutoverRecord[]
}

export interface EntitlementCutoverDryRunReport {
    gate: 'pass' | 'fail'
    totals: {
        sourceRecords: number
        verifiedPaidRecords: number
        grandfatheredExceptions: number
        staleTestRows: number
        eligibleImports: number
        alreadyLedgered: number
        preservedLegacyExceptions: number
        excludedStaleRows: number
    }
    coverage: {
        accountedVerifiedPaidRecords: number
        expectedVerifiedPaidRecords: number
    }
    counters: {
        missingImmutableProofs: number
        duplicateGrantCandidates: number
        staleTestImports: number
        formerOwnerRegrants: number
        unexplainedPaidToFreeDifferences: number
        identityAmbiguities: number
    }
    importRecordIds: string[]
    preservedLegacyRecordIds: string[]
    excludedRecordIds: string[]
    errors: string[]
}

const EVIDENCE_DIGEST = /^[0-9a-f]{64}$/

function duplicateValues(values: string[]): string[] {
    const counts = new Map<string, number>()
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
    return [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([value]) => value)
        .sort()
}

function isCanonicalPaidEvidence(record: EntitlementCutoverRecord): boolean {
    const evidence = record.canonical
    return Boolean(
        evidence &&
            evidence.checkoutSessionId &&
            evidence.ownerId === record.legacy.ownerId &&
            evidence.plan === record.legacy.plan &&
            evidence.livemode &&
            evidence.paymentStatus === 'paid' &&
            Number.isSafeInteger(evidence.amountTotal) &&
            evidence.amountTotal > 0 &&
            evidence.status === 'active' &&
            EVIDENCE_DIGEST.test(evidence.evidenceDigest),
    )
}

function matchesExistingLedger(record: EntitlementCutoverRecord): boolean {
    const evidence = record.canonical
    const ledger = record.existingLedger
    return Boolean(
        evidence &&
            ledger &&
            ledger.checkoutSessionId === evidence.checkoutSessionId &&
            ledger.originOwnerId === evidence.ownerId &&
            ledger.ownerId === evidence.ownerId &&
            ledger.plan === evidence.plan &&
            ledger.status === 'active',
    )
}

export function validateEntitlementCutoverDryRun(manifest: EntitlementCutoverManifest): EntitlementCutoverDryRunReport {
    const records = [...manifest.records].sort((a, b) => a.recordId.localeCompare(b.recordId))
    const errors: string[] = []
    let missingImmutableProofs = 0
    let staleTestImports = 0
    let formerOwnerRegrants = 0
    let unexplainedPaidToFreeDifferences = 0
    let identityAmbiguities = 0
    let accountedVerifiedPaidRecords = 0

    const importRecordIds: string[] = []
    const preservedLegacyRecordIds: string[] = []
    const excludedRecordIds: string[] = []

    const duplicateRecordIds = duplicateValues(records.map((record) => record.recordId))
    const duplicateLegacyOwners = duplicateValues(records.map((record) => record.legacy.ownerId))
    const duplicateCheckoutSessions = duplicateValues(
        records.flatMap((record) => (record.canonical ? [record.canonical.checkoutSessionId] : [])),
    )
    const duplicateGrantCandidates =
        duplicateRecordIds.length + duplicateLegacyOwners.length + duplicateCheckoutSessions.length

    for (const recordId of duplicateRecordIds) errors.push(`duplicate record id: ${recordId}`)
    for (const ownerId of duplicateLegacyOwners) errors.push(`duplicate legacy owner: ${ownerId}`)
    for (const sessionId of duplicateCheckoutSessions) errors.push(`duplicate checkout session: ${sessionId}`)

    for (const record of records) {
        if (!record.recordId || !record.legacy.ownerId) {
            identityAmbiguities += 1
            errors.push(`${record.recordId || '<missing-record-id>'}: missing synthetic identity`)
            continue
        }

        if (record.classification === 'verified_paid') {
            const canonicalPaid = isCanonicalPaidEvidence(record)
            if (!canonicalPaid) {
                missingImmutableProofs += 1
                errors.push(`${record.recordId}: verified paid record lacks complete canonical proof`)
            }

            if (
                record.existingLedger &&
                record.canonical &&
                record.existingLedger.originOwnerId === record.canonical.ownerId &&
                record.existingLedger.ownerId !== record.canonical.ownerId
            ) {
                formerOwnerRegrants += 1
                errors.push(
                    `${record.recordId}: proposed import would regrant a transferred entitlement to its former owner`,
                )
            }

            const freshImport = record.proposedAction === 'import' && record.existingLedger === null
            const existingMatch = record.proposedAction === 'already_ledgered' && matchesExistingLedger(record)
            if (canonicalPaid && (freshImport || existingMatch)) accountedVerifiedPaidRecords += 1

            if (freshImport) importRecordIds.push(record.recordId)
            if (!record.legacy.authorized || (!freshImport && !existingMatch)) {
                unexplainedPaidToFreeDifferences += 1
                errors.push(`${record.recordId}: verified paid access is not preserved by the dry run`)
            }
            continue
        }

        if (record.classification === 'grandfathered_non_revenue') {
            const preserved =
                record.legacy.plan === 'lifetime' &&
                record.legacy.authorized &&
                record.canonical === null &&
                record.existingLedger === null &&
                record.proposedAction === 'legacy_fallback'
            if (preserved) {
                preservedLegacyRecordIds.push(record.recordId)
            } else {
                unexplainedPaidToFreeDifferences += 1
                errors.push(
                    `${record.recordId}: grandfathered lifetime exception is not preserved only by legacy fallback`,
                )
            }
            continue
        }

        const excluded =
            record.legacy.plan === 'pro' &&
            record.canonical === null &&
            record.existingLedger === null &&
            record.proposedAction === 'exclude'
        if (excluded) {
            excludedRecordIds.push(record.recordId)
        } else {
            staleTestImports += 1
            errors.push(`${record.recordId}: stale test row is not cleanly excluded from the ledger`)
        }
    }

    const verifiedPaidRecords = records.filter((record) => record.classification === 'verified_paid').length
    const grandfatheredExceptions = records.filter(
        (record) => record.classification === 'grandfathered_non_revenue',
    ).length
    const staleTestRows = records.filter((record) => record.classification === 'stale_test').length

    const expectedCounts = [
        ['verified paid records', verifiedPaidRecords, manifest.expected.verifiedPaidRecords],
        ['grandfathered exceptions', grandfatheredExceptions, manifest.expected.grandfatheredExceptions],
        ['stale test rows', staleTestRows, manifest.expected.staleTestRows],
    ] as const
    for (const [label, actual, expected] of expectedCounts) {
        if (actual !== expected) {
            identityAmbiguities += 1
            errors.push(`expected ${expected} ${label}, found ${actual}`)
        }
    }

    const counters = {
        missingImmutableProofs,
        duplicateGrantCandidates,
        staleTestImports,
        formerOwnerRegrants,
        unexplainedPaidToFreeDifferences,
        identityAmbiguities,
    }
    const gate = Object.values(counters).every((count) => count === 0) ? 'pass' : 'fail'

    return {
        gate,
        totals: {
            sourceRecords: records.length,
            verifiedPaidRecords,
            grandfatheredExceptions,
            staleTestRows,
            eligibleImports: importRecordIds.length,
            alreadyLedgered: records.filter((record) => record.proposedAction === 'already_ledgered').length,
            preservedLegacyExceptions: preservedLegacyRecordIds.length,
            excludedStaleRows: excludedRecordIds.length,
        },
        coverage: {
            accountedVerifiedPaidRecords,
            expectedVerifiedPaidRecords: manifest.expected.verifiedPaidRecords,
        },
        counters,
        importRecordIds: importRecordIds.sort(),
        preservedLegacyRecordIds: preservedLegacyRecordIds.sort(),
        excludedRecordIds: excludedRecordIds.sort(),
        errors: errors.sort(),
    }
}
