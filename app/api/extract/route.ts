import { Readability } from '@mozilla/readability'
import { parseHTML } from 'linkedom'
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import { z } from 'zod'

import { AI_ERROR_CODES } from '@/config/ai'
import { createClient } from '@/lib/supabase/server'

const MAX_TEXT_LENGTH = 10_000
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const urlBodySchema = z.object({
    url: z.string().url(),
})

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md'])

function truncate(text: string): string {
    return text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text
}

function getExtension(filename: string): string {
    const idx = filename.lastIndexOf('.')
    return idx >= 0 ? filename.slice(idx).toLowerCase() : ''
}

async function extractFromUrl(url: string): Promise<{ text: string; title?: string }> {
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

async function extractFromFile(file: File): Promise<{ text: string; title?: string }> {
    if (file.size > MAX_FILE_SIZE) throw new Error('File exceeds 5MB limit')

    const ext = getExtension(file.name)
    if (!ALLOWED_EXTENSIONS.has(ext)) throw new Error(`Unsupported file type: ${ext}`)

    const title = file.name.slice(0, file.name.lastIndexOf('.')) || file.name

    let text: string

    if (ext === '.pdf') {
        const result = await pdfParse(Buffer.from(await file.arrayBuffer()))
        text = result.text
    } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(await file.arrayBuffer()) })
        text = result.value
    } else {
        text = new TextDecoder().decode(await file.arrayBuffer())
    }

    return { text: truncate(text), title }
}

export async function POST(request: Request) {
    // Auth: validate the anonymous session
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: AI_ERROR_CODES.AUTH_REQUIRED }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
        let formData: FormData
        try {
            formData = await request.formData()
        } catch {
            return Response.json({ error: 'Invalid form data' }, { status: 400 })
        }

        const file = formData.get('file')
        if (!(file instanceof File)) {
            return Response.json({ error: 'Missing file field' }, { status: 400 })
        }

        try {
            const result = await extractFromFile(file)
            return Response.json(result)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to extract file content'
            return Response.json({ error: message }, { status: 422 })
        }
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = urlBodySchema.safeParse(body)
    if (!parsed.success) {
        return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    }

    try {
        const result = await extractFromUrl(parsed.data.url)
        return Response.json(result)
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to extract URL content'
        return Response.json({ error: message }, { status: 422 })
    }
}
