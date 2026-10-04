import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('homepage metadata owns editor and preview intent', () => {
    const homepage = readFileSync(new URL('../app/(main)/page.tsx', import.meta.url), 'utf8')

    assert.match(homepage, /title: \{ absolute: 'LinkedIn Post Editor & Preview Tool - Free, No Signup' \}/)
    assert.match(
        homepage,
        /Free LinkedIn post editor with a live mobile and desktop preview\. Write, edit, and check your post before you copy it\. No signup\./,
    )
    assert.doesNotMatch(
        homepage.slice(homepage.indexOf('export const metadata'), homepage.indexOf('export default')),
        /formatter/i,
    )
})

test('formatter metadata owns formatter intent on its self-canonical route', () => {
    const formatter = readFileSync(new URL('../app/(main)/formatter/page.tsx', import.meta.url), 'utf8')

    assert.match(formatter, /title: \{ absolute: 'LinkedIn Post Formatter - Bold, Italic & Lists Tool' \}/)
    assert.match(formatter, /canonical: absoluteUrl\(Routes\.Formatter\)/)
    assert.match(formatter, /<h1[^>]*>\s*LinkedIn Post Formatter\s*<\/h1>/)
})
