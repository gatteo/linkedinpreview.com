import assert from 'node:assert/strict'
import test from 'node:test'

import { browser, loadTS, storage } from './helpers/component-harness.mjs'

const entry = await loadTS('config/entry-sources.ts')
const headerId = '00000000-0000-4000-8000-000000000011'
const draftId = '00000000-0000-4000-8000-000000000010'
const headerClock = '2026-10-07T09:30:00.000Z'

for (const variant of [undefined, 'control', 'pro']) {
    test(`draft import preserves ${String(variant)} header assignment and separate eligibility`, async () => {
        const localStorage = storage()
        const sessionStorage = storage()
        const window = browser(
            `https://preview.invalid/dashboard/editor?import=synthetic&from=tool_footer&activation=${draftId}`,
        )
        const header = await loadTS('lib/header-entry-experiment.ts')
        const events = []
        const input = {
            storage: localStorage,
            readVariant: () => variant,
            capture: (...args) => events.push(args),
            releaseSha: 'synthetic-main',
            createId: () => headerId,
            now: () => headerClock,
        }
        const enrolled = header.enrollHeaderEntry(input)
        const original = localStorage.getItem(header.DAILY_ENROLLMENT_KEY)
        const flow = await loadTS(
            'lib/draft-first.ts',
            { '@/config/entry-sources': entry },
            { window, localStorage, sessionStorage },
        )
        const pending = flow.prepareDraftFirst('tool_footer', draftId)
        const choice = flow.deferPlanning('synthetic-account', new URLSearchParams(window.location.search))
        const properties = flow.draftFirstProperties(choice)
        assert.equal(properties.enrollment_id, draftId)
        assert.equal(properties.eligibility_at, pending.eligibilityAt)
        assert.equal(properties.entry_source, 'tool_footer')
        assert.equal(properties.cohort_id, 'exp10_draft_first_v1')
        assert.equal(localStorage.getItem(header.DAILY_ENROLLMENT_KEY), original)
        assert.equal(flow.readDraftFirst('other-account'), null)
        const restored = await loadTS('lib/header-entry-experiment.ts')
        const resumed = restored.enrollHeaderEntry({ ...input, readVariant: () => undefined })
        assert.equal(resumed.enrollment.enrollmentId, headerId)
        assert.equal(resumed.enrollment.eligibilityAt, headerClock)
        assert.equal(resumed.enrollment.variant, enrolled.enrollment.variant)
        assert.equal(resumed.renderedVariant, 'control')
        assert.equal(localStorage.getItem(header.DAILY_ENROLLMENT_KEY), original)
        assert.notEqual(header.headerEntryProperties(resumed.enrollment).enrollment_id, properties.enrollment_id)
        assert.equal(flow.readDraftFirst('synthetic-account').exposureId, draftId)
    })
}
