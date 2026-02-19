import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'feedback.json')

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { rating, comment, timestamp } = body

        if (!rating || !timestamp) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        let entries: unknown[] = []
        try {
            const raw = await fs.readFile(FILE, 'utf-8')
            entries = JSON.parse(raw)
        } catch {
            // file doesn't exist yet — start fresh
        }

        entries.push({ rating, comment, timestamp })
        await fs.writeFile(FILE, JSON.stringify(entries, null, 2))

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
