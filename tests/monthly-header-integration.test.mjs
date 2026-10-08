import assert from 'node:assert/strict'
import test from 'node:test'

import { loadTS, storage } from './helpers/component-harness.mjs'

for (const flag of [undefined, 'control', 'pro']) {
    test(`monthly enrollment preserves frozen header control with later flag ${String(flag)}`, async () => {
        const local = storage()
        const entry = await loadTS('config/entry-sources.ts')
        const header = await loadTS('lib/header-entry-experiment.ts')
        const monthly = await loadTS(
            'lib/monthly-offer.ts',
            { '@/config/entry-sources': entry },
            { localStorage: local, window: { innerWidth: 1440 }, process: { env: {} } },
        )
        const events = []
        const headerInput = {
            storage: local,
            readVariant: () => undefined,
            capture: (event, props) => events.push({ event, props }),
            releaseSha: 'synthetic-header-release',
            createId: () => '00000000-0000-4000-8000-000000000011',
            now: () => '2026-10-07T11:00:00.000Z',
        }
        const initial = header.enrollHeaderEntry(headerInput)
        const frozen = local.getItem(header.DAILY_ENROLLMENT_KEY)
        monthly.rememberOfferEntry('navbar')
        const input = {
            userId: 'synthetic-account',
            billingState: 'free',
            isAnonymous: true,
            capture: (event, props) => events.push({ event, props }),
        }
        const offer = monthly.enrollMonthlyOffer(input)
        assert.notEqual(offer.enrollmentId, initial.enrollment.enrollmentId)
        assert.equal(offer.entrySource, 'navbar')
        assert.equal(local.getItem(header.DAILY_ENROLLMENT_KEY), frozen)
        const resumed = header.enrollHeaderEntry({ ...headerInput, readVariant: () => flag })
        assert.equal(resumed.renderedVariant, 'control')
        assert.equal(local.getItem(header.DAILY_ENROLLMENT_KEY), frozen)
        monthly.rememberOfferEntry('billing_return')
        assert.equal(monthly.enrollMonthlyOffer(input).eligibilityAt, offer.eligibilityAt)
        assert.equal(monthly.enrollMonthlyOffer(input).enrollmentId, offer.enrollmentId)
        const checkout = monthly.monthlyCheckoutAttribution(input.userId)
        assert.equal(checkout.cohortId, 'exp9_monthly_first_v2')
        assert.equal(checkout.assignedVariant, 'monthly_first')
        assert.equal(checkout.enrollmentId, offer.enrollmentId)
        assert.equal(checkout.entrySource, 'navbar')
        assert.equal(events.filter(({ event }) => event === 'paid_conversion_eligible').length, 1)
        assert.equal(events.find(({ event }) => event === 'daily_test_eligible').props.variant, 'pending')
    })
}
