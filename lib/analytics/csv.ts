// ---------------------------------------------------------------------------
// LinkedIn analytics CSV import.
//
// LinkedIn lets a member export their post analytics as a spreadsheet from the
// native UI. The exact columns drift between exports, so this parser is tolerant:
// it tokenizes the CSV, finds the header row by looking for a URL-ish column, and
// maps the remaining columns to our metric fields by fuzzy header matching. Rows
// are then matched back to the member's drafts by the stored LinkedIn post URL.
// ---------------------------------------------------------------------------

import type { MetricValues } from '@/lib/analytics/metrics'
import { EMPTY_METRIC_VALUES } from '@/lib/analytics/metrics'
import type { DraftManifestEntry } from '@/lib/drafts'

/** One parsed row: the post URL plus whatever metric columns were recognized. */
export interface ParsedMetricRow extends MetricValues {
    url: string
}

/** A CSV row matched to a draft, ready to upsert. */
export interface CsvMatch {
    draftId: string
    title: string
    values: MetricValues
}

export interface CsvImportResult {
    matched: CsvMatch[]
    /** Parsed rows that did not correspond to any post published through the app. */
    unmatchedCount: number
    /** Total data rows parsed (excludes the header). */
    totalRows: number
}

// Header keyword -> metric field. Checked in order; first hit wins per column so
// e.g. "Click-through" maps to linkClicks before any looser match.
const HEADER_MATCHERS: { field: keyof MetricValues; keywords: string[] }[] = [
    { field: 'impressions', keywords: ['impression'] },
    { field: 'reach', keywords: ['reach', 'unique'] },
    { field: 'reactions', keywords: ['reaction', 'like'] },
    { field: 'comments', keywords: ['comment'] },
    { field: 'reshares', keywords: ['repost', 'reshare', 'share'] },
    { field: 'saves', keywords: ['save'] },
    { field: 'sends', keywords: ['send'] },
    { field: 'linkClicks', keywords: ['click'] },
    { field: 'follows', keywords: ['follow'] },
    { field: 'profileViews', keywords: ['profile view'] },
]

/** Parse raw CSV text into metric rows. Returns [] when no usable header is found. */
export function parseLinkedInCsv(text: string): ParsedMetricRow[] {
    const rows = tokenizeCsv(text)
    if (rows.length < 2) return []

    const headerIndex = findHeaderRow(rows)
    if (headerIndex === -1) return []

    const header = rows[headerIndex].map((h) => h.trim().toLowerCase())
    const urlCol = header.findIndex((h) => h.includes('url') || h.includes('link'))
    if (urlCol === -1) return []

    // Resolve each metric field to a column index (first matching, unused column).
    const fieldCols: Partial<Record<keyof MetricValues, number>> = {}
    const usedCols = new Set<number>([urlCol])
    for (const { field, keywords } of HEADER_MATCHERS) {
        const col = header.findIndex((h, i) => !usedCols.has(i) && keywords.some((k) => h.includes(k)))
        if (col !== -1) {
            fieldCols[field] = col
            usedCols.add(col)
        }
    }

    const out: ParsedMetricRow[] = []
    for (let r = headerIndex + 1; r < rows.length; r++) {
        const cells = rows[r]
        const url = (cells[urlCol] ?? '').trim()
        if (!url || !/^https?:\/\//i.test(url)) continue

        const values: MetricValues = { ...EMPTY_METRIC_VALUES }
        for (const [field, col] of Object.entries(fieldCols) as [keyof MetricValues, number][]) {
            values[field] = parseCount(cells[col])
        }
        out.push({ url, ...values })
    }
    return out
}

/**
 * Match parsed rows to the member's drafts by LinkedIn post URL. Only posts
 * published through the app carry a `linkedinPostUrl`, so rows for posts created
 * elsewhere fall into `unmatchedCount`.
 */
export function matchCsvToDrafts(rows: ParsedMetricRow[], drafts: DraftManifestEntry[]): CsvImportResult {
    const byUrl = new Map<string, DraftManifestEntry>()
    for (const d of drafts) {
        if (d.linkedinPostUrl) byUrl.set(normalizeUrl(d.linkedinPostUrl), d)
    }

    const matched: CsvMatch[] = []
    let unmatchedCount = 0
    for (const row of rows) {
        const draft = byUrl.get(normalizeUrl(row.url))
        if (!draft) {
            unmatchedCount++
            continue
        }
        const { url: _url, ...values } = row
        matched.push({ draftId: draft.id, title: draft.title || 'Untitled', values })
    }

    return { matched, unmatchedCount, totalRows: rows.length }
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

/** A LinkedIn post URL, normalized for comparison (scheme/host/trailing slash agnostic). */
function normalizeUrl(url: string): string {
    let u = url.trim().toLowerCase()
    u = u.replace(/^https?:\/\//, '').replace(/^www\./, '')
    u = u.replace(/[?#].*$/, '') // drop query/hash
    u = u.replace(/\/+$/, '') // drop trailing slashes
    return u
}

/** Parse a count that may carry thousands separators, percent signs, or blanks. */
function parseCount(raw: string | undefined): number | null {
    if (raw === undefined) return null
    const cleaned = raw.replace(/[,%\s]/g, '').trim()
    if (cleaned === '' || cleaned === '-') return null
    const n = Number(cleaned)
    return Number.isFinite(n) ? Math.round(n) : null
}

/** Find the first row that looks like a header (has a URL/link column). */
function findHeaderRow(rows: string[][]): number {
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
        const lower = rows[i].map((c) => c.trim().toLowerCase())
        const hasUrl = lower.some((c) => c.includes('url') || c.includes('link'))
        const hasMetric = lower.some((c) => HEADER_MATCHERS.some((m) => m.keywords.some((k) => c.includes(k))))
        if (hasUrl && hasMetric) return i
    }
    return -1
}

/** Minimal RFC-4180-ish CSV tokenizer: handles quoted fields, escaped quotes, CRLF. */
function tokenizeCsv(text: string): string[][] {
    const rows: string[][] = []
    let row: string[] = []
    let field = ''
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"'
                    i++
                } else {
                    inQuotes = false
                }
            } else {
                field += ch
            }
            continue
        }
        if (ch === '"') {
            inQuotes = true
        } else if (ch === ',') {
            row.push(field)
            field = ''
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++
            row.push(field)
            field = ''
            // Skip fully empty lines
            if (row.length > 1 || row[0] !== '') rows.push(row)
            row = []
        } else {
            field += ch
        }
    }
    // Trailing field/row (no final newline)
    if (field !== '' || row.length > 0) {
        row.push(field)
        if (row.length > 1 || row[0] !== '') rows.push(row)
    }
    return rows
}
