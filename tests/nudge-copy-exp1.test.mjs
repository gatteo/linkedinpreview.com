import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('draft-first nudge preserves the free planning offer and existing nudge mechanics', async () => {
    const source = await readFile(new URL('../components/tool/tool.tsx', import.meta.url), 'utf8')

    assert.match(source, /toast\('Nice post\. Keep working in the full editor\.'/)
    assert.match(source, /Get a free audit and a personalized 90-day plan whenever you want\./)
    assert.match(source, /label: 'Continue my draft'/)
    assert.match(source, /const NUDGE_MIN_CHARS = 160/)
    assert.match(source, /duration: 12000/)
    assert.match(source, /onClick: \(\) => handleOpenDashboard\('tool_nudge'\)/)
})
