import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('homepage metadata states the free formatter and editor use case', () => {
    const page = readFileSync(new URL('../app/(main)/page.tsx', import.meta.url), 'utf8')

    assert.match(page, /title: \{ absolute: 'LinkedIn Post Preview Tool - Free Formatter & Editor' \}/)
    assert.match(
        page,
        /Free LinkedIn post formatter and editor with a live preview\. Add bold, italic, underline, and lists, then check mobile and desktop before publishing\. No signup\./,
    )
})
