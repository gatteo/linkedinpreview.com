import assert from 'node:assert/strict'
import test from 'node:test'

import { loadTS } from './helpers/component-harness.mjs'

const truncate = await loadTS('lib/truncate-title.ts')
const types = await loadTS('lib/carousel/types.ts')
const serialize = await loadTS('lib/carousel/serialize.ts', {
    '@/lib/carousel/types': types,
    '@/lib/truncate-title': truncate,
})
const drafts = await loadTS('lib/drafts.ts', {
    '@/lib/carousel/serialize': serialize,
    '@/lib/carousel/types': types,
    '@/lib/truncate-title': truncate,
})
const diagnostics = await loadTS('lib/draft-create-diagnostics.ts')
const persistence = await loadTS('lib/supabase/drafts.ts', {
    '@/lib/draft-create-diagnostics': diagnostics,
    '@/lib/drafts': drafts,
})

const ROCKET = '\u{1F680}'
const LONE_SURROGATE = /\\ud[89ab][0-9a-f]{2}(?!\\ud[c-f])|(?<!\\ud[89ab][0-9a-f]{2})\\ud[c-f][0-9a-f]{2}/i

function textAt(start) {
    return 'a'.repeat(start) + ROCKET + ' tail of a long first paragraph that keeps going'
}

function doc(text) {
    return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

function wellFormed(value) {
    return !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value)
}

test('title never ends on a lone high surrogate when an emoji straddles the cut', () => {
    const title = drafts.extractTitle(doc(textAt(56)))
    assert.ok(wellFormed(title))
    assert.equal(title, 'a'.repeat(56) + '...')
})

test('titles that do not straddle the cut are unchanged', () => {
    assert.equal(drafts.extractTitle(doc(textAt(55))), 'a'.repeat(55) + ROCKET + '...')
    assert.equal(drafts.extractTitle(doc(textAt(57))), 'a'.repeat(57) + '...')
    assert.equal(drafts.extractTitle(doc('Short title')), 'Short title')
    assert.equal(drafts.extractTitle(doc('x'.repeat(60))), 'x'.repeat(60))
    assert.equal(drafts.extractTitle(doc('x'.repeat(61))), 'x'.repeat(57) + '...')
})

test('carousel titles use the same surrogate-safe cut', () => {
    const deck = {
        version: 1,
        slides: [{ id: 's1', role: 'hook', elements: [{ id: 'e1', type: 'text', text: textAt(56) }] }],
    }
    const title = serialize.carouselTitle(deck)
    assert.ok(wellFormed(title))
    assert.equal(title, 'a'.repeat(56) + '...')
})

function recordingClient(calls) {
    const builder = {
        insert(row) {
            calls.push({ op: 'insert', body: JSON.stringify(row) })
            return builder
        },
        update(patch) {
            calls.push({ op: 'update', body: JSON.stringify(patch) })
            return builder
        },
        select: () => builder,
        eq: () => Promise.resolve({ error: null }),
        single: () => Promise.resolve({ data: { id: 'd1', title: 't', kind: 'post' }, error: null, status: 201 }),
    }
    return { from: () => builder }
}

test('create and update request bodies carry no lone surrogate escapes', async () => {
    const calls = []
    const client = recordingClient(calls)
    for (const start of [54, 55, 56, 57]) {
        await persistence.createDraft(client, '00000000-0000-4000-8000-000000000000', doc(textAt(start)))
        await persistence.updateDraft(client, 'd1', { content: doc(textAt(start)) })
    }
    assert.equal(calls.length, 8)
    for (const call of calls) assert.doesNotMatch(call.body, LONE_SURROGATE, `${call.op} body`)
})
