import assert from 'node:assert/strict'
import test from 'node:test'
import runes from 'runes'

import { loadTS } from './helpers/component-harness.mjs'

const { applyStyles, processNodes, toPlainText } = await loadTS('components/tool/utils.ts', { runes })

test('bold digits keep their emphasis in LinkedIn-ready plain text', () => {
    assert.equal(applyStyles('0123456789', ['BOLD']), '𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵')
})

test('bold italic uses bold digits because Unicode has no italic digit alphabet', () => {
    assert.equal(applyStyles('2026', ['BOLD', 'ITALIC']), '𝟮𝟬𝟮𝟲')
    assert.equal(applyStyles('2026', ['ITALIC', 'BOLD']), '𝟮𝟬𝟮𝟲')
})

test('copy serialization preserves a mixed bold sentence without changing its document', () => {
    const doc = {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: [
                    { type: 'text', text: 'Save ' },
                    { type: 'text', text: '25% in 2026', marks: [{ type: 'bold' }] },
                    { type: 'text', text: ' 🚀' },
                ],
            },
        ],
    }
    const original = JSON.stringify(doc)
    const processed = processNodes(doc)
    assert.equal(toPlainText(processed.content), 'Save 𝟮𝟱% 𝗶𝗻 𝟮𝟬𝟮𝟲 🚀')
    assert.equal(JSON.stringify(doc), original)
    assert.equal(toPlainText(processed.content, { range: true }), 'Save 𝟮𝟱% 𝗶𝗻 𝟮𝟬𝟮𝟲 🚀')
})

test('plain and italic-only digits, punctuation and existing styled digits stay unchanged', () => {
    assert.equal(applyStyles('0123456789', []), '0123456789')
    assert.equal(applyStyles('0123456789', ['ITALIC']), '0123456789')
    assert.equal(applyStyles('$25.50 + 𝟮𝟱 🚀', ['BOLD']), '$𝟮𝟱.𝟱𝟬 + 𝟮𝟱 🚀')
})

test('exclusive font styles keep their existing priority and underline still composes', () => {
    assert.equal(applyStyles('25', ['BOLD', 'CODE']), '25')
    assert.equal(applyStyles('25', ['BOLD', 'UNDERLINE']), '𝟮̲𝟱̲')
})

test('bold preserves digit keycap emoji graphemes with and without variation selectors', () => {
    const text = '1️⃣ 2⃣ #️⃣ *️⃣'
    assert.equal(applyStyles(text, ['BOLD']), text)
    assert.equal(applyStyles(text, ['BOLD', 'ITALIC']), text)
})
