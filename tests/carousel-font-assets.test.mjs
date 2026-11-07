import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const manifest = JSON.parse(read('public/fonts/carousel/sources.json'))
const css = read('styles/carousel-fonts.css')
const fontModule = read('lib/carousel/fonts.ts')
const layout = read('app/dashboard/carousel/layout.tsx')
const sha = (data) => createHash('sha256').update(data).digest('hex')
const declarations = (rule) =>
    Object.fromEntries(
        rule
            .slice(rule.indexOf('{') + 1, rule.lastIndexOf('}'))
            .split(';')
            .filter((part) => part.includes(':'))
            .map((part) => {
                const colon = part.indexOf(':')
                const key = part.slice(0, colon).trim()
                const value = part.slice(colon + 1).trim()
                return [key, key === 'unicode-range' ? value.replace(/\s/g, '') : value]
            }),
    )

test('all carousel assets, original face descriptors and pinned licenses retain exact provenance', () => {
    assert.equal(manifest.faceCount, 89)
    assert.equal(manifest.uniqueAssetCount, 23)
    assert.equal(manifest.allFacesAndBytesEqualCurrentBuild, true)
    assert.equal(new Set(manifest.faces.map((face) => face.file)).size, 23)
    const actualFaces = [...css.matchAll(/@font-face\s*\{[^}]+\}/g)].map(([rule]) => declarations(rule))
    assert.equal(actualFaces.length, 95)
    for (const face of manifest.faces) {
        const data = readFileSync(new URL(`../public/fonts/carousel/${face.file}`, import.meta.url))
        assert.equal(data.subarray(0, 4).toString(), 'wOF2')
        assert.equal(data.length, face.bytes)
        assert.equal(sha(data), face.sha256)
        assert.ok(face.url.startsWith('https://fonts.gstatic.com/'))
        const expected = declarations(face.rule)
        expected.src = `url('/fonts/carousel/${face.file}') format('woff2')`
        assert.ok(
            actualFaces.some((actual) => JSON.stringify(actual) === JSON.stringify(expected)),
            face.file,
        )
        for (const filename of ['OFL.txt', 'METADATA.pb']) {
            const source = face[filename]
            const text = read(`public/fonts/carousel/${face.slug}-${filename}`)
            assert.equal(sha(text), source.sha256)
            assert.ok(source.source.includes(`/${manifest.officialUpstreamRevision}/ofl/${face.slug}/`))
            if (filename === 'OFL.txt') assert.ok(text.includes('SIL OPEN FONT LICENSE'))
        }
    }
    assert.doesNotMatch(css, /https?:\/\//)
})

test('fallback metrics, six variables, Latin-only preloads and shared export class stay intact', () => {
    const metrics = [
        ['Inter', '90.44%', '22.52%', '107.12%', 'Arial'],
        ['Montserrat', '85.79%', '22.25%', '112.83%', 'Arial'],
        ['DM Sans', '94.9%', '29.66%', '104.53%', 'Arial'],
        ['Space Grotesk', '89.71%', '26.62%', '109.69%', 'Arial'],
        ['Playfair Display', '97.25%', '22.56%', '111.26%', 'Times New Roman'],
        ['Bebas Neue', '117.32%', '39.11%', '76.72%', 'Arial'],
    ]
    const faces = [...css.matchAll(/@font-face\s*\{[^}]+\}/g)].map(([rule]) => declarations(rule))
    for (const [family, ascent, descent, size, fallback] of metrics) {
        const face = faces.find((entry) => entry['font-family'] === `${family} Fallback`)
        assert.deepEqual(face, {
            'font-family': `${family} Fallback`,
            'src': `local(${fallback})`,
            'ascent-override': ascent,
            'descent-override': descent,
            'line-gap-override': '0%',
            'size-adjust': size,
        })
    }
    for (const variable of ['inter', 'montserrat', 'dm-sans', 'space-grotesk', 'playfair', 'bebas']) {
        assert.ok(css.includes(`--cf-${variable}:`))
        assert.ok(fontModule.includes(`var(--cf-${variable})`))
    }
    assert.match(fontModule, /carouselFontVars = 'carousel-fonts'/)
    const preloads = [...fontModule.matchAll(/'\/fonts\/carousel\/([^']+)'/g)].map((match) => match[1])
    assert.equal(preloads.length, 6)
    assert.ok(preloads.every((file) => file.endsWith('-latin.woff2')))
    assert.match(layout, /carouselFontPreloads\.map/)
    assert.match(layout, /crossOrigin='anonymous'/)
    assert.match(layout, /@\/styles\/carousel-fonts\.css/)
    assert.match(read('lib/carousel/export.ts'), /host.className = carouselFontVars/)
    assert.match(read('components/dashboard/carousel/render/slide-artboard.tsx'), /className=\{carouselFontVars\}/)
})

test('carousel no longer enters Google import-map parser while root scope remains unchanged', () => {
    assert.doesNotMatch(fontModule, /next\/font\/(google|local)/)
    assert.match(read('app/layout.tsx'), /from 'next\/font\/google'/)
    assert.equal(manifest.families.length, 6)
    for (const [family, , weights] of manifest.families) {
        const actual = [...new Set(manifest.faces.filter((face) => face.family === family).map((face) => face.weight))]
        assert.deepEqual(actual.sort(), [...weights].sort())
    }
})
