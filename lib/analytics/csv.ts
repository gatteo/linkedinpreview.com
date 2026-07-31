// ---------------------------------------------------------------------------
// LinkedIn post history import.
//
// LinkedIn's native "Post analytics" export (linkedin.com/analytics/creator/content/
// > Export) is an XLSX workbook with several sheets (DISCOVERY, ENGAGEMENT, TOP
// POSTS, FOLLOWERS, DEMOGRAPHICS); the one with per-post numbers is "Top posts".
// We don't parse XLSX directly (no workbook dependency in the project), so the
// UI asks the member to save that sheet as CSV first. The exact columns drift
// between exports, so this parser is tolerant: it tokenizes the CSV, finds the
// header row by looking for a URL-ish column, and maps the remaining columns to
// our metric fields by fuzzy header matching.
//
// Rows are matched back to the member's drafts by the stored LinkedIn post URL
// when possible. Rows for posts the member wrote before/outside the app have no
// matching draft - those become new `published` history posts (see
// `planCsvImport`) so the export is a genuine one-time backfill, not just a
// metrics top-up for posts already tracked.
// ---------------------------------------------------------------------------

import type { MetricValues } from '@/lib/analytics/metrics'
import { EMPTY_METRIC_VALUES, hasAnyMetric } from '@/lib/analytics/metrics'
import type { DraftManifestEntry } from '@/lib/drafts'

/** One parsed row: the post URL plus whatever metric/date columns were recognized. */
export interface ParsedMetricRow extends MetricValues {
    url: string
    /** Epoch ms parsed from a date/publish-date column, or null when not found. */
    publishedAtMs: number | null
}

/** A CSV row matched to a post already tracked by the app, ready to upsert. */
export interface CsvMatch {
    kind: 'matched'
    draftId: string
    title: string
    values: MetricValues
}

/** A CSV row for a post the app doesn't know about yet - a new history post. */
export interface CsvNewPost {
    kind: 'new'
    url: string
    values: MetricValues
    publishedAtMs: number | null
}

export type CsvImportRow = CsvMatch | CsvNewPost

export interface CsvImportResult {
    matched: CsvMatch[]
    newPosts: CsvNewPost[]
    /** Parsed rows with no url match AND no usable metric - nothing to import. */
    skippedCount: number
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

    const usedCols = new Set<number>([urlCol])
    const dateCol = header.findIndex((h, i) => !usedCols.has(i) && (h.includes('date') || h.includes('publish')))
    if (dateCol !== -1) usedCols.add(dateCol)

    // Resolve each metric field to a column index (first matching, unused column).
    const fieldCols: Partial<Record<keyof MetricValues, number>> = {}
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
        const publishedAtMs = dateCol !== -1 ? parseCsvDate(cells[dateCol]) : null
        out.push({ url, publishedAtMs, ...values })
    }
    return out
}

/**
 * Reconcile parsed rows against the member's drafts by LinkedIn post URL. Posts
 * already published through the app (or backfilled by a previous import) update
 * in place; everything else becomes a new history post, as long as it carries at
 * least one real metric (a bare URL with no numbers isn't worth creating a post
 * for).
 */
export function planCsvImport(rows: ParsedMetricRow[], drafts: DraftManifestEntry[]): CsvImportResult {
    const byUrl = new Map<string, DraftManifestEntry>()
    for (const d of drafts) {
        if (d.linkedinPostUrl) byUrl.set(normalizeUrl(d.linkedinPostUrl), d)
    }

    const matched: CsvMatch[] = []
    const newPosts: CsvNewPost[] = []
    let skippedCount = 0

    for (const row of rows) {
        const { url, publishedAtMs, ...values } = row
        const draft = byUrl.get(normalizeUrl(url))
        if (draft) {
            matched.push({ kind: 'matched', draftId: draft.id, title: draft.title || 'Untitled', values })
        } else if (hasAnyMetric(values)) {
            newPosts.push({ kind: 'new', url, values, publishedAtMs })
        } else {
            skippedCount++
        }
    }

    return { matched, newPosts, skippedCount, totalRows: rows.length }
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

/** Parse a date cell (ISO, "Jul 3, 2026", or M/D/YYYY). Returns null when unrecognized. */
function parseCsvDate(raw: string | undefined): number | null {
    if (!raw) return null
    const trimmed = raw.trim()
    if (!trimmed) return null

    const parsed = Date.parse(trimmed)
    if (!Number.isNaN(parsed)) return parsed

    // Excel/Sheets often localize dates to M/D/YYYY, which some engines fail to
    // parse via Date.parse - handle it explicitly rather than dropping the row.
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(trimmed)
    if (match) {
        const [, m, d, y] = match
        const year = y.length === 2 ? 2000 + Number(y) : Number(y)
        const ms = Date.UTC(year, Number(m) - 1, Number(d))
        return Number.isNaN(ms) ? null : ms
    }
    return null
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
