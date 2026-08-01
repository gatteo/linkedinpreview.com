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

// One source per PLACEMENT, not per copy string: "Open the full editor" appears on
// four different surfaces, and collapsing them would hide which one is worth fixing.
export const ENTRY_SOURCES = [
    // Plan/audit intent - the CTA promises what the flow actually delivers.
    'navbar', // header "Create my plan" (desktop only - hidden md:flex)
    'mobile_nav', // header mobile sheet
    'plan_section', // home plan CTA
    'footer', // site footer
    'tool_nudge', // toast after writing a post - carries the draft
    'tool_footer', // tool footer strip - carries the draft

    // Editor intent - the CTA promises an editor and the flow opens on an audit.
    // These are the majority of arrivals and the weakest converters.
    'hero_editor', // home hero "Open the full editor"
    'features_header', // home features header "Open in full editor"
    'features_card', // home features card "Open the full editor"
    'showcase', // home dashboard showcase "Open the full editor"
    'tool_header', // tool section header "Open in full editor"

    // Branding intent - clicked to set a name and photo.
    'branding_popover', // preview popover "Show your own name and photo"

    // Server redirects back into the dashboard. Only these two are emitted: the
    // email-confirm redirect lands on settings and belongs to a user who already
    // finished onboarding, so it can never be a funnel entry.
    'oauth_return',
    'billing_return',

    'hero', // legacy: components/home/hero-cta.tsx, currently unmounted
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

    // Editor intent: two thirds of all arrivals clicked a button promising an
    // editor and landed on an audit. They reach the paywall at roughly a third
    // the rate of people who were promised a plan. The title names both halves
    // of the deal up front - the editor they clicked for, and the audit that
    // stands between them and it - so the flow is never a surprise.
    ...Object.fromEntries(
        (['hero_editor', 'features_header', 'features_card', 'showcase', 'tool_header'] as const).map((source) => [
            source,
            {
                headlinePre: 'View the ',
                headlineHighlight: 'full editor',
                headlinePost: ' and complete an audit.',
                sub: 'I’ll read your LinkedIn and tune the editor to your voice, topics and goals, so every draft starts personalized instead of blank. About 3 minutes.',
            },
        ]),
    ),

    // Clicked to put their own name and photo on the preview. The flow does
    // exactly that, from their profile - lead with it.
    branding_popover: {
        headlinePre: 'Let’s put ',
        headlineHighlight: 'your name and face',
        headlinePost: ' on it.',
        sub: 'I’ll pull your name, photo and headline straight from LinkedIn, then tune the editor to how you actually write. About 3 minutes.',
    },
}
