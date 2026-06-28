import type { OgPreviewData } from './types'

export interface ParseMetaResult {
    data: OgPreviewData
    // Whether the raw HTML contained ANY og:* or twitter:* tags. Used to flag
    // pages that likely inject their meta tags client-side (invisible to crawlers).
    hadAnyOgTags: boolean
}

const NAMED_ENTITIES: Record<string, string> = {
    amp: '&',
    quot: '"',
    apos: "'",
    lt: '<',
    gt: '>',
    nbsp: ' ',
}

function decodeEntities(value: string): string {
    return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
        if (entity[0] === '#') {
            const isHex = entity[1] === 'x' || entity[1] === 'X'
            const code = isHex ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
            if (Number.isNaN(code)) return match
            try {
                return String.fromCodePoint(code)
            } catch {
                return match
            }
        }
        return NAMED_ENTITIES[entity.toLowerCase()] ?? match
    })
}

function getAttr(tag: string, name: string): string | null {
    const quoted = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i')
    const m = tag.match(quoted)
    if (m) return decodeEntities(m[2] ?? m[3] ?? '')

    const unquoted = new RegExp(`\\b${name}\\s*=\\s*([^\\s"'>]+)`, 'i')
    const u = tag.match(unquoted)
    if (u) return decodeEntities(u[1])

    return null
}

// Linear, single-pass comment stripper. A lazy global regex (`/<!--[\s\S]*?-->/g`)
// degrades to O(n^2) on crafted input with many unterminated `<!--` tokens, which
// would block the event loop on a 2 MB body. indexOf scanning stays O(n).
function stripComments(html: string): string {
    let result = ''
    let i = 0
    for (;;) {
        const start = html.indexOf('<!--', i)
        if (start === -1) {
            result += html.slice(i)
            break
        }
        result += html.slice(i, start)
        const end = html.indexOf('-->', start + 4)
        // Unterminated comment runs to EOF (matches how a browser/crawler parses it).
        if (end === -1) break
        i = end + 3
    }
    return result
}

function splitRel(rel: string): string[] {
    return rel.toLowerCase().split(/\s+/)
}

function resolveUrl(value: string | undefined | null, base: string): string | undefined {
    if (!value) return undefined
    try {
        return new URL(value, base).toString()
    } catch {
        return value
    }
}

function pathnameOf(url: string): string {
    try {
        return new URL(url).pathname.toLowerCase()
    } catch {
        return url.toLowerCase().split('?')[0].split('#')[0]
    }
}

const EXT_TO_TYPE: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    avif: 'image/avif',
    bmp: 'image/bmp',
}

function imageTypeFromUrl(url: string | undefined): string | undefined {
    if (!url) return undefined
    const ext = pathnameOf(url).match(/\.([a-z0-9]+)$/)
    if (!ext) return undefined
    return EXT_TO_TYPE[ext[1]]
}

export function isWebpImage(data: Pick<OgPreviewData, 'imageType' | 'imageUrl'>): boolean {
    if (data.imageType?.toLowerCase() === 'image/webp') return true
    if (!data.imageUrl) return false
    return pathnameOf(data.imageUrl).endsWith('.webp')
}

export function parseMeta(html: string, requestedUrl: string, finalUrl: string): ParseMetaResult {
    const clean = stripComments(html)

    // Collect all meta property/name -> content pairs (first occurrence wins).
    const meta = new Map<string, string>()
    let hadAnyOgTags = false
    const metaTags = clean.match(/<meta\b[^>]*>/gi) ?? []
    for (const tag of metaTags) {
        const key = (getAttr(tag, 'property') ?? getAttr(tag, 'name'))?.toLowerCase()
        const content = getAttr(tag, 'content')
        if (!key || content === null) continue
        if (key.startsWith('og:') || key.startsWith('twitter:')) hadAnyOgTags = true
        if (!meta.has(key)) meta.set(key, content.trim())
    }

    const get = (key: string): string | undefined => {
        const v = meta.get(key)
        return v && v.length > 0 ? v : undefined
    }

    // <title>
    const titleMatch = clean.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const htmlTitle = titleMatch ? decodeEntities(titleMatch[1].trim()) || undefined : undefined

    // <link> tags (canonical + favicons)
    const linkTags = clean.match(/<link\b[^>]*>/gi) ?? []
    const links = linkTags
        .map((tag) => ({ rel: getAttr(tag, 'rel'), href: getAttr(tag, 'href') }))
        .filter((l): l is { rel: string; href: string } => Boolean(l.rel && l.href))

    const canonicalHref = links.find((l) => splitRel(l.rel).includes('canonical'))?.href
    const canonicalUrl = resolveUrl(canonicalHref, finalUrl)
    const ogUrl = resolveUrl(get('og:url'), finalUrl)

    const title = get('og:title') ?? get('twitter:title') ?? htmlTitle
    const description = get('og:description') ?? get('twitter:description') ?? get('description')
    const siteName = get('og:site_name')

    const rawImage = get('og:image:secure_url') ?? get('og:image') ?? get('twitter:image') ?? get('twitter:image:src')
    const imageUrl = resolveUrl(rawImage, finalUrl)
    const imageType = get('og:image:type') ?? imageTypeFromUrl(imageUrl)

    const iconHref =
        links.find((l) => splitRel(l.rel).includes('apple-touch-icon'))?.href ??
        links.find((l) => splitRel(l.rel).includes('icon'))?.href
    const faviconUrl = resolveUrl(iconHref, finalUrl) ?? resolveUrl('/favicon.ico', finalUrl)

    const data: OgPreviewData = {
        requestedUrl,
        // Prefer the publisher-declared canonical/og:url for the displayed source,
        // matching how LinkedIn attributes the link. Fall back to where we landed.
        finalUrl: ogUrl ?? canonicalUrl ?? finalUrl,
        title,
        description,
        imageUrl,
        imageType,
        siteName,
        faviconUrl,
    }

    return { data, hadAnyOgTags }
}
