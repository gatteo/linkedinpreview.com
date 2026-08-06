import { Readability } from '@mozilla/readability'
import { parseHTML } from 'linkedom'
import mammoth from 'mammoth'

const MAX_TEXT_LENGTH = 10_000
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md'])

function truncate(text: string): string {
    return text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text
}

function getExtension(filename: string): string {
    const idx = filename.lastIndexOf('.')
    return idx >= 0 ? filename.slice(idx).toLowerCase() : ''
}

/**
 * pdf-parse pulls in pdfjs, whose legacy build evaluates `new DOMMatrix()` at
 * module scope. It tries to polyfill that itself by `createRequire`-ing its
 * optional `@napi-rs/canvas` dep, but that call is invisible to Next's file
 * tracer, so the package never reaches the deployment and the module throws
 * `ReferenceError: DOMMatrix is not defined` while evaluating. Importing canvas
 * ourselves both installs the globals and makes the dependency traceable.
 *
 * Both imports stay inside this branch: a top-level one took the whole route
 * down with it, so URL, .docx and .txt extraction 500'd on a PDF-only fault.
 */
async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
    const canvas = await import('@napi-rs/canvas')
    const globals = globalThis as Record<string, unknown>
    globals.DOMMatrix ??= canvas.DOMMatrix
    globals.ImageData ??= canvas.ImageData
    globals.Path2D ??= canvas.Path2D

    const { PDFParse } = await import('pdf-parse')
    const pdf = new PDFParse({ data: new Uint8Array(buffer) })
    try {
        const result = await pdf.getText()
        return result.text
    } finally {
        await pdf.destroy()
    }
}

export async function extractFromUrl(url: string): Promise<{ text: string; title?: string }> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5_000)

    let html: string
    try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
        html = await res.text()
    } finally {
        clearTimeout(timeout)
    }

    const { document } = parseHTML(html)
    const article = new Readability(document as unknown as Document).parse()

    if (!article) throw new Error('Could not parse article content')

    return {
        text: truncate(article.textContent ?? ''),
        title: article.title ?? undefined,
    }
}

export async function extractFromFile(file: File): Promise<{ text: string; title?: string }> {
    if (file.size > MAX_FILE_SIZE) throw new Error('File exceeds 5MB limit')

    const ext = getExtension(file.name)
    if (!ALLOWED_EXTENSIONS.has(ext)) throw new Error(`Unsupported file type: ${ext}`)

    const title = file.name.slice(0, file.name.lastIndexOf('.')) || file.name

    let text: string

    if (ext === '.pdf') {
        text = await extractPdfText(await file.arrayBuffer())
    } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(await file.arrayBuffer()) })
        text = result.value
    } else {
        text = new TextDecoder().decode(await file.arrayBuffer())
    }

    return { text: truncate(text), title }
}
