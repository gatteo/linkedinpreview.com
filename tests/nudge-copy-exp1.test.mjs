import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('dashboard nudge uses the clear free-plan EXP-1 variant without changing its mechanics', async () => {
    const source = await readFile(new URL('../components/tool/tool.tsx', import.meta.url), 'utf8')

    assert.match(source, /toast\('Nice post\. Plan what to publish next\.'/)
    assert.match(source, /Get a free audit and a personalized 90-day posting plan\. This draft comes with you\./)
    assert.match(source, /label: 'Create a free plan'/)
    assert.match(source, /const NUDGE_MIN_CHARS = 160/)
    assert.match(source, /duration: 12000/)
    assert.match(source, /onClick: \(\) => handleOpenDashboard\('tool_nudge'\)/)
})
