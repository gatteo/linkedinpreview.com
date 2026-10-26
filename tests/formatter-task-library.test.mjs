import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { parseHTML } from 'linkedom'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const source = readFileSync(new URL('../app/(main)/formatter/task-library.tsx', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
    compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
    },
}).outputText
const loaded = { exports: {} }
runInNewContext(compiled, {
    exports: loaded.exports,
    module: loaded,
    require(name) {
        if (name === 'react/jsx-runtime') return jsxRuntime
        assert.equal(name, 'next/link', 'The task library must not import client behavior or the editor')
        return ({ children, ...props }) => React.createElement('a', props, children)
    },
})
const html = renderToStaticMarkup(React.createElement(loaded.exports.FormatterTaskLibrary))
const { document } = parseHTML(html)
const section = document.querySelector('section')

test('three complete before/after walkthroughs render as static semantic HTML', () => {
    assert.equal(section.id, 'how-it-works')
    assert.equal(document.getElementById(section.getAttribute('aria-labelledby')).tagName, 'H2')
    assert.equal(section.querySelectorAll('h3').length, 3)
    const articles = [...section.querySelectorAll('article')]
    assert.equal(articles.length, 3)
    for (const article of articles) {
        assert.equal(document.getElementById(article.getAttribute('aria-labelledby')).tagName, 'H3')
        assert.equal(article.querySelectorAll('figure').length, 2)
        assert.match(article.querySelectorAll('figcaption')[0].textContent, /Before: plain-text draft/)
        assert.match(article.querySelectorAll('figcaption')[1].textContent, /After: formatted pattern/)
    }
    assert.equal(articles[0].querySelectorAll('strong').length, 1)
    assert.equal(articles[1].querySelectorAll('ul > li').length, 3)
    assert.equal(articles[2].querySelector('strong').textContent, '2026 plan: 3 experiments, 2 weeks, 1 decision.')
    assert.ok(articles[2].textContent.includes('1️⃣'))
})

test('all related guide destinations exist in the content collection', () => {
    const links = [...section.querySelectorAll('a')]
    assert.equal(links.length, 4)
    for (const link of links) {
        const href = link.getAttribute('href')
        assert.match(href, /^\/blog\/[a-z-]+$/)
        assert.ok(readFileSync(new URL(`../contents${href}.mdx`, import.meta.url), 'utf8').length > 0)
    }
})

test('examples do not inject drafts, offer sample-copy actions or add tracking', () => {
    assert.equal(section.querySelectorAll('button, input, textarea, script, [contenteditable]').length, 0)
    assert.doesNotMatch(source, /use client|posthog|clipboard|onClick|fetch\(|useEffect|localStorage/)
    assert.match(section.textContent, /these examples do not replace your saved draft/)
    assert.match(section.textContent, /Unicode lookalike characters/)
    assert.match(section.textContent, /native copy action/)
})

test('only the formatter route substitutes the shared HowToUse call site', () => {
    const formatter = readFileSync(new URL('../app/(main)/formatter/page.tsx', import.meta.url), 'utf8')
    const home = readFileSync(new URL('../app/(main)/page.tsx', import.meta.url), 'utf8')
    assert.match(formatter, /<Tool \/>\s*<FormatterTaskLibrary \/>/)
    assert.doesNotMatch(formatter, /HowToUse/)
    assert.match(home, /<HowToUse \/>/)
    assert.doesNotMatch(home, /FormatterTaskLibrary/)
})
