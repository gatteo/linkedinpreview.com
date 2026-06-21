// ---------------------------------------------------------------------------
// Display formatting for analytics figures. Nulls render as an em dash so an
// unknown value is visually distinct from a real zero.
// ---------------------------------------------------------------------------

const DASH = '-'

const compactFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

/** Compact count, e.g. 1234 -> "1.2K". Null/undefined -> em dash. */
export function formatCount(n: number | null | undefined): string {
    if (n === null || n === undefined) return DASH
    return compactFormatter.format(n)
}

/** Exact count with thousands separators. Null/undefined -> em dash. */
export function formatExact(n: number | null | undefined): string {
    if (n === null || n === undefined) return DASH
    return n.toLocaleString('en-US')
}

/** A 0..1 fraction as a percentage, e.g. 0.0423 -> "4.2%". Null -> em dash. */
export function formatPercent(fraction: number | null | undefined, digits = 1): string {
    if (fraction === null || fraction === undefined) return DASH
    return `${(fraction * 100).toFixed(digits)}%`
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

export function formatDate(ms: number): string {
    return dateFormatter.format(new Date(ms))
}

export function formatShortDate(ms: number): string {
    return shortDateFormatter.format(new Date(ms))
}
