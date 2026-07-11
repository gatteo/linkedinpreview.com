// ---------------------------------------------------------------------------
// Onboarding enrichment shared types - used by the onboarding API routes, the
// client rich-pipeline hook, and the insight screens.
//
// Two-tier model: a FAST profile lookup (Scrapingdog or JSON-LD, seconds) feeds
// the Mirror screen, while a RICH Bright Data snapshot (posts + followers,
// 42-60s async) lands in the background and powers the insight cards. Every
// number shown to the user is either computed deterministically from fetched
// data (ObservedCadence, mix counts) or framed as an industry benchmark - the
// LLM only ever labels, never counts.
// ---------------------------------------------------------------------------

/**
 * Extended public identity from the fast tier (Scrapingdog only - the JSON-LD
 * fallback can't see these fields, so every one is optional and the UI hides
 * missing rows). Shown on the Reassure profile card and threaded through the
 * flow (languages drive the recap sentence and the bilingual paywall line).
 */
export type FastIdentity = {
    location?: string
    coverUrl?: string
    publicId?: string
    /** Provider label strings, shown verbatim (e.g. "3K", "500+"). */
    followersLabel?: string
    connectionsLabel?: string
    languages?: { name: string; level: string }[]
    experience?: { name: string; logoUrl: string }[]
    education?: string
    awards?: string[]
}

/** A post normalized from the rich (Bright Data) snapshot. */
export type RichPost = {
    text: string
    /** ISO date when the source record had one (authored posts usually do). */
    date?: string
    /** 'post' = authored by the member; 'activity' = liked/reshared (not their writing). */
    origin: 'post' | 'activity'
}

/** Trimmed rich-profile identity persisted server-side and echoed to the client. */
export type RichProfileSummary = {
    name: string
    headline: string
    about: string
    avatarUrl: string
    followers: number | null
    connections: number | null
}

/**
 * Deterministic posting-rhythm numbers computed from authored-post dates (never
 * by the LLM). postsPerWeek averages over the sample's own span so a truncated
 * post list can't understate an active poster; newestPostAt lets the UI detect
 * a long-dormant profile instead of quoting a stale average.
 */
export type ObservedCadence = {
    postsLast30d: number
    postsLast90d: number
    /** Average posts/week across the sample span, 1 decimal. Null when the span is a single day. */
    postsPerWeek: number | null
    newestPostAt: string
    oldestPostAt: string
}

export type RichScrapeStatus = 'idle' | 'pending' | 'ready' | 'empty' | 'failed' | 'unavailable'

/**
 * Writing-style defaults inferred deterministically from the user's real posts
 * (regex counting, never the LLM). Prefills branding.writingStyle so the
 * Branding page arrives populated with how they actually write.
 */
export type StyleHints = {
    sentenceLength: 'short' | 'standard' | 'long'
    emojiFrequency: 'none' | 'moderate' | 'a-lot'
}

/** Slim rich summary the client keeps in answers/localStorage (never the full posts). */
export type RichSummary = {
    postsCount: number
    followers: number | null
    observed: ObservedCadence | null
    styleHints?: StyleHints | null
}

/** Response shape of GET /api/onboarding/enrich/status. */
export type RichStatusResponse = {
    rich: {
        status: RichScrapeStatus
        profile?: RichProfileSummary
        postsCount?: number
        observed?: ObservedCadence | null
        styleHints?: StyleHints | null
    }
    insightsReady: boolean
}

// --- Insights ---------------------------------------------------------------

export const INSIGHT_CATEGORIES = [
    'personal-story',
    'educational',
    'opinion',
    'promotional',
    'engagement-social',
    'other',
] as const

export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number]

export type InsightsKind = 'posts' | 'profile' | 'benchmark'

/**
 * Audit counts for the reveal report. The LLM labels each post (hook yes/no,
 * ends-on-question yes/no); the server counts the labels - never the model.
 * Present only on kind 'posts'.
 */
export type InsightsAudit = {
    hooks: { withHook: number; total: number }
    ctas: { endingWithQuestion: number; total: number }
}

export type OnboardingInsights = {
    kind: InsightsKind
    /** Deterministic server-computed numbers only; null means unknown and the UI suppresses the sentence. */
    observed: {
        postsAnalyzed: number | null
        postsLast30d: number | null
        postsPerWeek: number | null
        newestPostAt: string | null
        followers: number | null
    }
    /** Category mix of the analyzed posts; counts aggregated server-side from LLM labels. */
    mix: { category: InsightCategory; count: number; sharePct: number }[]
    dominant: InsightCategory | null
    /** Missing content categories, benchmark-framed. */
    missing: { category: InsightCategory; why: string }[]
    /** Topics they already write about (evidence-checked against the corpus). */
    currentTopics: string[]
    /** Adjacent topics worth expanding into, each tied to their goal. */
    adjacentTopics: { topic: string; why: string }[]
    /** Grounded voice observation; excerpt is substring-verified server-side or null. */
    voice: { tone: string; excerpt: string | null }
    /** One-line strongest insight, echoed on the offer screen. */
    headline: string
    /** Server-counted content-quality flags for the audit report (kind 'posts' only). */
    audit?: InsightsAudit
    generatedAt: string
}
