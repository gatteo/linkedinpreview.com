import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root))
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const sources = JSON.parse(read('public/fonts/google/sources.json'))
const css = read('styles/fonts.css').toString()
const layout = read('app/layout.tsx').toString()
const declarations = (rule) =>
    Object.fromEntries(
        rule
            .slice(rule.indexOf('{') + 1, rule.lastIndexOf('}'))
            .split(';')
            .filter((part) => part.trim())
            .map((part) => {
                const colon = part.indexOf(':')
                return [
                    part.slice(0, colon).trim(),
                    part
                        .slice(colon + 1)
                        .trim()
                        .replaceAll('"', "'")
                        .replace(/\s+/g, ' ')
                        .replace(/\b0\.0%/g, '0%'),
                ]
            }),
    )

test('bundled font bytes, licenses and original face descriptors remain exact', () => {
    assert.equal(sources.faces.length, 28)
    assert.equal(new Set(sources.faces.map((face) => face.path)).size, 16)
    const rules = [...css.matchAll(/@font-face\s*\{[^}]+\}/g)].map(([rule]) => declarations(rule))
    for (const face of sources.faces) {
        const bytes = read(face.path)
        assert.equal(bytes.subarray(0, 4).toString(), 'wOF2')
        assert.equal(bytes.length, face.size)
        assert.equal(hash(bytes), face.sha256)
        const license = read(`public/fonts/google/${face.licenseDirectory}-OFL.txt`)
        assert.equal(hash(license), face.licenseSha256)
        assert.match(license.toString(), /SIL OPEN FONT LICENSE Version 1\.1/)
        const expected = declarations(face.rule.replace(face.url, '/' + face.path.replace(/^public\//, '')))
        assert.ok(
            rules.some((rule) => JSON.stringify(rule) === JSON.stringify(expected)),
            `${face.family} ${face.subset}`,
        )
    }
    assert.equal(rules.length, 31)
    assert.doesNotMatch(css, /https?:|fonts\.gstatic|fonts\.googleapis/)
})

test('original variables, fallback metrics and Latin-only preloads remain', () => {
    for (const [family, variable, ascent, descent, size] of [
        ['Inter', 'inter', '90.44%', '22.52%', '107.12%'],
        ['Bricolage Grotesque', 'bricolage', '88.21%', '25.61%', '105.43%'],
        ['JetBrains Mono', 'jetbrains', '75.79%', '22.29%', '134.59%'],
    ]) {
        assert.ok(css.includes(`--font-${variable}: '${family}', '${family} Fallback'`))
        const fallback = [...css.matchAll(/@font-face\s*\{[^}]+\}/g)]
            .map(([rule]) => declarations(rule))
            .find(
                (rule) =>
                    rule['font-family'] === `'${family} Fallback'` || rule['font-family'] === `${family} Fallback`,
            )
        assert.deepEqual(fallback, {
            'font-family': `${family} Fallback`,
            'src': 'local(Arial)',
            'ascent-override': ascent,
            'descent-override': descent,
            'line-gap-override': '0%',
            'size-adjust': size,
        })
    }
    const preloads = [...layout.matchAll(/href='(\/fonts\/google\/[^']+)'/g)].map((match) => match[1])
    assert.deepEqual(preloads, [
        '/fonts/google/inter-latin.woff2',
        '/fonts/google/bricolagegrotesque-latin.woff2',
        '/fonts/google/jetbrainsmono-latin.woff2',
    ])
    for (const face of sources.faces.filter((face) => face.subset === 'latin')) {
        assert.ok(preloads.includes('/' + face.path.replace(/^public\//, '')))
    }
    assert.equal((layout.match(/crossOrigin='anonymous'/g) || []).length, 3)
    assert.match(
        layout,
        /localFont\(\{\s*src: '\.\.\/public\/fonts\/CalSans-SemiBold\.woff2',\s*variable: '--font-cal'/,
    )
})

test('application no longer enters the Google font macro/query parser', () => {
    const walk = (dir) =>
        readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap((entry) =>
            entry.isDirectory() ? walk(join(dir, entry.name) + '/') : [join(dir, entry.name)],
        )
    for (const file of walk('app/').filter((file) => /\.(ts|tsx|js|jsx)$/.test(file))) {
        assert.doesNotMatch(read(file).toString(), /next\/font\/google/)
    }
    assert.match(layout, /import '@\/styles\/fonts\.css'/)
    // Offline shape regression using ORIGINAL LIN194's captured query, not a new CI outage or Rust execution.
    const query =
        '{%22url%22:%22https://fonts.gstatic.com/l/font%3Fkit=UcCB3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfU5NJeWUdIOjBeTGiXZdAD2MVsiEu&skey=c491285d6722e4fa&v=v20%22,%22preload%22:false,%22has_size_adjust%22:true}'
    assert.equal([...new URLSearchParams(query)].length, 3)
    assert.equal(query.split('&').length, 3)
})
