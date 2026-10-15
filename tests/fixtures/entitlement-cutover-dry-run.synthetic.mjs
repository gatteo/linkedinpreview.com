function syntheticOwnerId(index) {
    return `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`
}

function syntheticDigest(index) {
    return index.toString(16).padStart(64, '0')
}

function verifiedPaidRecord(index, plan) {
    const suffix = String(index).padStart(2, '0')
    const ownerId = syntheticOwnerId(index)
    return {
        recordId: `synthetic-paid-${suffix}`,
        classification: 'verified_paid',
        legacy: { ownerId, plan, authorized: true },
        canonical: {
            checkoutSessionId: `cs_synthetic_paid_${suffix}`,
            ownerId,
            plan,
            livemode: true,
            paymentStatus: 'paid',
            amountTotal: plan === 'lifetime' ? 3999 : 1199,
            status: 'active',
            evidenceDigest: syntheticDigest(index),
        },
        existingLedger: null,
        proposedAction: 'import',
    }
}

export const syntheticEntitlementCutoverManifest = {
    version: 1,
    expected: {
        verifiedPaidRecords: 15,
        grandfatheredExceptions: 1,
        staleTestRows: 1,
    },
    records: [
        ...Array.from({ length: 15 }, (_, index) => verifiedPaidRecord(index + 1, index < 12 ? 'lifetime' : 'pro')),
        {
            recordId: 'synthetic-grandfathered-lifetime',
            classification: 'grandfathered_non_revenue',
            legacy: { ownerId: syntheticOwnerId(16), plan: 'lifetime', authorized: true },
            canonical: null,
            existingLedger: null,
            proposedAction: 'legacy_fallback',
        },
        {
            recordId: 'synthetic-stale-test-pro',
            classification: 'stale_test',
            legacy: { ownerId: syntheticOwnerId(17), plan: 'pro', authorized: true },
            canonical: null,
            existingLedger: null,
            proposedAction: 'exclude',
        },
    ],
}

export function cloneSyntheticEntitlementCutoverManifest() {
    return structuredClone(syntheticEntitlementCutoverManifest)
}
