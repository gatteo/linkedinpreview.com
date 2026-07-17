import { type DraftStatus } from '@/lib/drafts'

/**
 * Canonical post-status -> semantic-token styles. Single source of truth so
 * every surface (posts table, calendar, badges) renders identical, theme-aware
 * status colors. Maps: draft -> warning (amber), scheduled -> info (blue),
 * published -> success (green), failed -> error/destructive (red).
 */

/** Soft-tinted badge/chip: pale fill + solid hue text. Theme-aware. */
export const POST_STATUS_BADGE: Record<DraftStatus, string> = {
    draft: 'bg-warning-soft text-warning',
    scheduled: 'bg-info-soft text-info',
    published: 'bg-success-soft text-success',
    failed: 'bg-error-soft text-error',
}

/** Solid status dot. */
export const POST_STATUS_DOT: Record<DraftStatus, string> = {
    draft: 'bg-warning',
    scheduled: 'bg-info',
    published: 'bg-success',
    failed: 'bg-error',
}

/**
 * Format-label dot palette. Drawn from the brand's petrol/vermilion ramps and
 * muted status hues (no raw rainbow utilities) so labels read as one family.
 */
const LABEL_DOT: Record<string, string> = {
    'Personal Milestones': 'bg-petrol-500',
    'Mindset & Motivation': 'bg-orange-500',
    'Career Before & After': 'bg-success',
    'Tool & Resource Insights': 'bg-info',
    'Case Studies': 'bg-petrol-300',
    'Actionable Guides': 'bg-orange-300',
    'Culture Moments': 'bg-warning',
    'Offer Highlight': 'bg-orange-700',
    'Client Success Story': 'bg-petrol-700',
}

export function labelColor(label: string): string {
    return LABEL_DOT[label] ?? 'bg-muted-foreground'
}
