// ---------------------------------------------------------------------------
// Entry sources - which surface sent a user into the dashboard, and therefore
// into the onboarding flow.
//
// Carried as a `?from=` query param rather than inferred from a click event.
// A param survives the navigation, works for keyboard activation and
// middle-click, and still attributes the visit when the click event is lost -
// which is how ~75% of onboarding entries ended up unattributed.
//
// The controller reads it once on mount, stamps it on every onb_* event and on
// the persisted session, then strips it from the URL.
// ---------------------------------------------------------------------------

export const ENTRY_PARAM = 'from'

export const ENTRY_SOURCES = [
    'navbar', // header "Create my plan" (desktop only - hidden md:flex)
    'mobile_nav', // header mobile sheet
    'hero', // home hero "or open the full dashboard"
    'plan_section', // home plan CTA
    'footer', // site footer
    'tool_nudge', // toast after writing a post - carries the draft
    'tool_footer', // tool footer button - carries the draft
] as const

export type EntrySource = (typeof ENTRY_SOURCES)[number]

/** `direct` = arrived with no attributable surface (typed URL, bookmark, external link). */
export type ResolvedEntrySource = EntrySource | 'direct'

export function parseEntrySource(value: string | null | undefined): ResolvedEntrySource {
    return ENTRY_SOURCES.includes(value as EntrySource) ? (value as EntrySource) : 'direct'
}

/** Append the entry source to a dashboard href, preserving any existing query. */
export function withEntrySource(href: string, source: EntrySource): string {
    const separator = href.includes('?') ? '&' : '?'
    return `${href}${separator}${ENTRY_PARAM}=${source}`
}

// ---------------------------------------------------------------------------
// Entry-coherent welcome copy.
//
// The welcome screen loses ~34% of arrivals, and the largest identified cause
// is a broken premise: the CTA promises one thing, the flow opens on another.
// Sources listed here continue the promise they were clicked with. Anything not
// listed falls through to the experiment-controlled default hero, unchanged.
// ---------------------------------------------------------------------------

export type EntryWelcomeCopy = {
    headlinePre: string
    headlineHighlight: string
    headlinePost: string
    sub: string
    /** Rendered as a reassurance chip when the entry carried the user's draft. */
    draftSaved?: boolean
}

export const ENTRY_WELCOME: Partial<Record<ResolvedEntrySource, EntryWelcomeCopy>> = {
    // Clicked "Create my plan" on a post they had just written, told the draft
    // comes with them. It does - it imports behind the modal - but they cannot
    // see it, so the first thing this screen does is confirm it.
    tool_nudge: {
        headlinePre: 'Your draft is saved. Now the ',
        headlineHighlight: 'plan',
        headlinePost: ' behind it.',
        sub: 'I’ll audit your LinkedIn, learn your goals, and build the strategy that makes posts like this one land, plus the full toolkit to write them.',
        draftSaved: true,
    },
    tool_footer: {
        headlinePre: 'Your draft is saved. Now the ',
        headlineHighlight: 'plan',
        headlinePost: ' behind it.',
        sub: 'I’ll audit your LinkedIn, learn your goals, and build the strategy that makes posts like this one land, plus the full toolkit to write them.',
        draftSaved: true,
    },
}
