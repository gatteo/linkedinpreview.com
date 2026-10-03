import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../utils/urls.ts', import.meta.url), 'utf8')
const executableSource = source.replace(/^import .*$/gm, '')
const compiledSource = ts.transpileModule(`const UtmSource = 'linkedinpreview.com'\n${executableSource}`, {
    compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
    },
}).outputText
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiledSource).toString('base64')}`
const { UtmUrl } = await import(moduleUrl)

const tracking = {
    medium: 'blog',
    content: 'card_cta',
}

const cases = [
    ['root path', '/', '/?utm_source=linkedinpreview.com&utm_medium=blog&utm_content=card_cta'],
    [
        'existing query parameters',
        '/?existing=1',
        '/?existing=1&utm_source=linkedinpreview.com&utm_medium=blog&utm_content=card_cta',
    ],
    ['fragment', '/#tool', '/?utm_source=linkedinpreview.com&utm_medium=blog&utm_content=card_cta#tool'],
    [
        'existing query parameters and fragment',
        '/?existing=1#tool',
        '/?existing=1&utm_source=linkedinpreview.com&utm_medium=blog&utm_content=card_cta#tool',
    ],
]

for (const [name, input, expected] of cases) {
    test(`UtmUrl preserves ${name}`, () => {
        assert.equal(UtmUrl(input, tracking), expected)
    })
}
