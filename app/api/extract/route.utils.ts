import { Readability } from '@mozilla/readability'
import { parseHTML } from 'linkedom'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

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
        const pdf = new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) })
        const result = await pdf.getText()
        text = result.text
        await pdf.destroy()
    } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(await file.arrayBuffer()) })
        text = result.value
    } else {
        text = new TextDecoder().decode(await file.arrayBuffer())
    }

    return { text: truncate(text), title }
}
