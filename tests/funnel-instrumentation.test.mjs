import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('..', import.meta.url)

async function source(path) {
    return readFile(new URL(path, root), 'utf8')
}

test('free-tool dashboard CTAs record the canonical entry events', async () => {
    const tool = await source('components/tool/tool.tsx')

    assert.match(tool, /dashboard_nudge_clicked/)
    assert.match(tool, /tool_pro_cta_click/)
})

test('upgrade dialog records canonical pricing and purchase-intent events', async () => {
    const dialog = await source('components/dashboard/upgrade-dialog.tsx')

    assert.match(dialog, /pricing_view/)
    assert.match(dialog, /upgrade_click/)
})

test('event dictionary documents every canonical revenue event', async () => {
    const dictionary = await source('docs/analytics/onboarding-funnel.md')

    for (const event of [
        'dashboard_nudge_clicked',
        'pricing_view',
        'upgrade_click',
        'affiliate_click',
        'tool_pro_cta_click',
    ]) {
        assert.match(dictionary, new RegExp(`\\\`${event}\\\``))
    }
})
