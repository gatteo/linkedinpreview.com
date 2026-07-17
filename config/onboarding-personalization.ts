// ---------------------------------------------------------------------------
// Onboarding personalization engine (role-driven matrix)
//
// The heart of the conversion redesign (docs/onboarding-conversion-redesign.md
// §3 + the V2 update). Every "tailored" moment - Mirror opportunity line,
// Reinforce benchmarks, insight-card fallbacks, Recap feature row, Offer - reads
// from one typed config keyed on the user's role and cross-cut by primary goal.
// PMs/designers tune copy here without touching flow logic.
//
// Honesty rule for everything in this file: benchmark/pattern lines are always
// framed as industry patterns, never as the user's own metrics, and never
// fabricated counts of "people like you".
// ---------------------------------------------------------------------------

import type { InsightCategory } from '@/types/onboarding'
import type { Tone } from '@/config/ai'
import type { BrandingRole } from '@/lib/branding'
import type { ScheduleSlot, StrategyAudience, StrategyGoal } from '@/lib/strategy'

/** The 7 concrete roles (BrandingRole minus the empty default). */
export type Role = Exclude<BrandingRole, ''>

/** Human labels for each role, shared across the onboarding steps. */
export const ROLE_LABELS: Record<Role, string> = {
    'founder': 'Founder',
    'freelancer': 'Freelancer',
    'team-lead': 'Team lead',
    'employee': 'Employee',
    'creator': 'Creator',
    'consultant': 'Consultant',
    'agency': 'Agency owner',
}

/** Plural label for the social-proof reinforce screen ("3,200 Founders ..."). */
export function rolePlural(role: Role): string {
    return `${ROLE_LABELS[role]}s`
}

// --- Niche options (Mirror manual setup dropdown) --------------------------
// A curated shortlist keeps the niche a single, consistent string (used as the
// first-post topic and in the reinforce screen) instead of free-form typing.

export const NICHE_OPTIONS: string[] = [
    'B2B SaaS',
    'Marketing & growth',
    'Sales',
    'Product management',
    'Software engineering',
    'Design & UX',
    'Data & AI',
    'Finance & fintech',
    'HR & recruiting',
    'Leadership & management',
    'Startups & entrepreneurship',
    'Consulting',
    'E-commerce',
    'Real estate',
    'Healthcare',
    'Coaching',
    'Career development',
    'Content creation',
]

// --- Insight benchmarks (reinforce screen + insight cards) ------------------
// Honest industry-pattern lines, always framed as benchmarks - never presented
// as the user's own metrics and never fabricated counts of "people like you".

export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
    'personal-story': 'Personal stories',
    'educational': 'Educational',
    'opinion': 'Opinions & takes',
    'promotional': 'Promotional',
    'engagement-social': 'Engagement & social',
    'other': 'Other',
}

/** What strong presences in each role visibly have in common (reinforce screen). */
export const ROLE_BENCHMARKS: Record<Role, string[]> = {
    'founder': [
        'They post decisions and reasoning, not announcements.',
        'They show up 3+ times a week, even in busy quarters.',
        'They mix personal lessons with educational posts buyers can use.',
    ],
    'freelancer': [
        'They publish the answers they already give on every client call.',
        'They post consistently, so prospects arrive pre-sold.',
        'They balance proof of work with useful how-to content.',
    ],
    'consultant': [
        'They publish their frameworks instead of guarding them.',
        'They keep a steady weekly rhythm their audience can rely on.',
        'They pair strong opinions with educational depth.',
    ],
    'agency': [
        'They run content on a schedule, not on inspiration.',
        'They show client thinking, not just client logos.',
        'They mix promotional wins with educational breakdowns.',
    ],
    'team-lead': [
        'They share the tradeoffs behind team decisions.',
        'They post regularly enough that candidates find a living feed.',
        'They mix leadership lessons with behind-the-scenes stories.',
    ],
    'employee': [
        'They make one skill visibly theirs with small, specific posts.',
        'They show up weekly, not just when job hunting.',
        'They share real work stories recruiters can act on.',
    ],
    'creator': [
        'They optimize for saves and shares, not likes.',
        'They keep a cadence their audience can set a clock by.',
        'They rotate formats: stories, how-tos, and clear takes.',
    ],
}

/**
 * The content category most associated with each goal, with a benchmark-framed
 * why. Drives the no-posts gap insight and the first-post prescription.
 */
export const GOAL_GAP: Record<StrategyGoal, { category: InsightCategory; why: string }> = {
    'revenue-growth': {
        category: 'educational',
        why: 'Educational posts are what strangers save and share - they bring in buyers who arrive already convinced you know your craft.',
    },
    'company-awareness': {
        category: 'opinion',
        why: 'Clear opinions travel beyond your own network - they are the posts people quote, debate, and remember your name from.',
    },
    'career-opportunities': {
        category: 'personal-story',
        why: 'Personal stories about your work make your skills legible to hiring managers - people hire people, not keyword lists.',
    },
    'employer-branding': {
        category: 'personal-story',
        why: 'Behind-the-scenes stories about how your team works are what candidates actually read before applying.',
    },
    'media-pr': {
        category: 'opinion',
        why: 'Journalists and event organizers look for a clear point of view - opinion posts are your public audition.',
    },
}

/** Static cadence benchmark for the insight cards (industry framing, no user metrics). */
export const CADENCE_BENCHMARK_LINE =
    'Across LinkedIn, people who post 3+ times a week consistently reach far more people over a quarter than sporadic posters. Consistency, not virality, is the compounding lever.'

export type SpotlightFeature = 'analytics' | 'calendar' | 'carousels' | 'weekly-ideas'

export type RoleContent = {
    /** Mirror screen: the role's "biggest opportunity" line. */
    mirrorOpportunity: string
    /** Spotlight screen: the single high-value feature to showcase. */
    spotlight: SpotlightFeature
    defaultGoal: StrategyGoal
    defaultAudience: StrategyAudience[]
}

// --- §3.2 Per-role content matrix -----------------------------------------

export const ROLE_CONTENT: Record<Role, RoleContent> = {
    'founder': {
        mirrorOpportunity: 'Turn your expertise into inbound - your audience is buyers, not peers.',
        spotlight: 'analytics',
        defaultGoal: 'revenue-growth',
        defaultAudience: ['new-clients'],
    },
    'freelancer': {
        mirrorOpportunity: "Consistent authority posts = a pipeline that doesn't depend on referrals.",
        spotlight: 'carousels',
        defaultGoal: 'revenue-growth',
        defaultAudience: ['new-clients'],
    },
    'consultant': {
        mirrorOpportunity: 'Your insight is the product - package it so prospects come pre-sold.',
        spotlight: 'analytics',
        defaultGoal: 'revenue-growth',
        defaultAudience: ['new-clients'],
    },
    'agency': {
        mirrorOpportunity: 'Scale a posting machine across clients without the manual grind.',
        spotlight: 'calendar',
        defaultGoal: 'company-awareness',
        defaultAudience: ['partners'],
    },
    'team-lead': {
        mirrorOpportunity: 'Lead in public - your team and your hires are watching.',
        spotlight: 'calendar',
        defaultGoal: 'employer-branding',
        defaultAudience: ['talents'],
    },
    'employee': {
        mirrorOpportunity: 'Stand out without spending hours - show your work, get noticed.',
        spotlight: 'weekly-ideas',
        defaultGoal: 'career-opportunities',
        defaultAudience: ['potential-employers'],
    },
    'creator': {
        mirrorOpportunity: 'Compound your audience - formats that get saved and shared.',
        spotlight: 'carousels',
        defaultGoal: 'company-awareness',
        defaultAudience: ['new-clients'],
    },
}

/** Role fallback when unknown (skipped LinkedIn + skipped role): creator/generalist (§3.1). */
export const DEFAULT_ROLE: Role = 'creator'

export function getRoleContent(role: BrandingRole | undefined | null): RoleContent {
    if (role && role in ROLE_CONTENT) return ROLE_CONTENT[role as Role]
    return ROLE_CONTENT[DEFAULT_ROLE]
}

export function resolveRole(role: BrandingRole | undefined | null): Role {
    return role && role in ROLE_CONTENT ? (role as Role) : DEFAULT_ROLE
}

// --- §3.3 Goal overlay -----------------------------------------------------
// Re-skins the offer headline + recap "goalRestated" string.

export const GOAL_RESTATED: Record<StrategyGoal, string> = {
    'revenue-growth': 'win more clients',
    'company-awareness': 'grow your company reach',
    'career-opportunities': 'get noticed by the right people',
    'employer-branding': 'attract better talent',
    'media-pr': 'earn media and authority',
}

export function goalRestated(goal: StrategyGoal | undefined | null): string {
    // The goal can arrive from client-written storage - unknown values fall back
    // instead of rendering "undefined" in copy.
    return (goal && GOAL_RESTATED[goal]) || 'grow on LinkedIn'
}

// --- Welcome motivation taps (§ Screen 1) ----------------------------------
// Single-select; seeds primaryGoal + provisional audience.

export type WelcomeOption = {
    key: string
    label: string
    /** lucide-react icon name. */
    icon: string
    goal: StrategyGoal
    audience: StrategyAudience[]
}

export const WELCOME_OPTIONS: WelcomeOption[] = [
    {
        key: 'clients',
        label: 'Win more clients & revenue',
        icon: 'TrendingUp',
        goal: 'revenue-growth',
        audience: ['new-clients'],
    },
    {
        key: 'company',
        label: "Grow my company's awareness",
        icon: 'Megaphone',
        goal: 'company-awareness',
        audience: ['partners'],
    },
    {
        key: 'brand',
        label: 'Build my personal brand',
        icon: 'Sparkles',
        goal: 'revenue-growth',
        audience: ['new-clients'],
    },
    {
        key: 'career',
        label: 'Find career opportunities',
        icon: 'Briefcase',
        goal: 'career-opportunities',
        audience: ['potential-employers'],
    },
    { key: 'hire', label: 'Hire & employer branding', icon: 'Users', goal: 'employer-branding', audience: ['talents'] },
]

// --- Cadence commitment (§ Screen 9) ---------------------------------------

export type Cadence = 'steady-2x' | 'recommended-3x' | 'daily'

export type CadenceOption = {
    value: Cadence
    label: string
    sub: string
    frequency: number
    schedule: ScheduleSlot[]
    recommended?: boolean
}

export const CADENCE_OPTIONS: CadenceOption[] = [
    {
        value: 'steady-2x',
        label: '2x a week',
        sub: 'Steady',
        frequency: 2,
        schedule: [{ time: '09:00', days: ['tue', 'thu'] }],
    },
    {
        value: 'recommended-3x',
        label: '3x a week',
        sub: 'Recommended',
        frequency: 3,
        schedule: [{ time: '09:00', days: ['mon', 'wed', 'fri'] }],
        recommended: true,
    },
    {
        value: 'daily',
        label: 'Daily',
        sub: 'Aggressive growth',
        frequency: 5,
        schedule: [{ time: '09:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'] }],
    },
]

export function cadenceOption(value: Cadence | undefined | null): CadenceOption {
    return CADENCE_OPTIONS.find((c) => c.value === value) ?? CADENCE_OPTIONS[1]
}

export function postsPerMonth(frequency: number): number {
    return Math.round(frequency * 4.3)
}

// --- Feature spotlight (§ Screen 8) ----------------------------------------

export type SpotlightContent = {
    icon: string
    eyebrow: string
    headline: string
    line: string
}

export const SPOTLIGHT_CONTENT: Record<SpotlightFeature, SpotlightContent> = {
    'analytics': {
        icon: 'BarChart3',
        eyebrow: 'Analytics',
        headline: 'See which posts actually drive your profile views.',
        line: 'Know what to write next from your own numbers, not guesswork.',
    },
    'calendar': {
        icon: 'CalendarDays',
        eyebrow: 'Calendar & scheduling',
        headline: 'Plan a month of posts in one sitting.',
        line: 'Schedule once and auto-publish when LinkedIn is connected - no daily scramble.',
    },
    'carousels': {
        icon: 'LayoutGrid',
        eyebrow: 'Carousels',
        headline: 'Turn one idea into a swipeable carousel that gets saved and shared.',
        line: 'The format that compounds reach - built in, no design tools.',
    },
    'weekly-ideas': {
        icon: 'Lightbulb',
        eyebrow: 'AI post ideas',
        headline: 'Never wonder what to post - generate 5 fresh ideas anytime.',
        line: 'Hooks tailored to your niche, ready to write whenever you are stuck.',
    },
}

// --- Tone seed from inferred toneSummary -----------------------------------

export function toneFromSummary(summary: string | undefined | null): Tone {
    const s = (summary ?? '').toLowerCase()
    if (/story|narrativ/.test(s)) return 'storytelling'
    if (/funny|humor|witty|playful/.test(s)) return 'humorous'
    if (/inspir|motivat|bold/.test(s)) return 'inspirational'
    if (/teach|educat|explain|practical|how-to/.test(s)) return 'educational'
    if (/casual|friendly|relaxed|conversational/.test(s)) return 'casual'
    return 'professional'
}

// --- Fallback first-post templates (§4.2 + §9) -----------------------------
// Used when first-post AI generation fails so the "aha" screen never breaks.
// PLACEHOLDER quality bar: keep these strong; replace/expand before launch.
// {topic} is replaced with the user's niche/first topic when available.

export const FALLBACK_POSTS: Record<Role, string> = {
    'founder': `Everyone told me to "build in public."

Nobody told me what that actually means when you have a company to run.

Here's what worked for us in **{topic}**:

We stopped posting announcements and started posting decisions - the messy ones, with the reasoning.

One honest post about a pricing mistake brought in three sales calls. A polished launch post brought in none.

The lesson: founders don't win attention by looking finished. They win it by being useful out loud.

What's a decision you're wrestling with right now? Post the thinking, not just the outcome.`,
    'freelancer': `I used to think referrals were my whole business.

Then a quiet month reminded me how fragile that is.

So I changed one thing in **{topic}**: I started writing down what I already explain to every client.

Not clever. Not viral. Just the same answers I give on every call, posted publicly.

Within weeks, prospects were booking calls already half-convinced - because they'd read me first.

Your expertise is a pipeline. You just have to make it visible.

What's the one thing you explain on repeat? That's your next post.`,
    'consultant': `Most consultants sell their time.

The best ones sell their thinking - and let the time follow.

Here's the shift that changed my **{topic}** practice:

I stopped guarding my "frameworks" and started publishing them.

The fear was that I'd give away the value. The opposite happened. Prospects arrived pre-sold, quoting my own ideas back to me.

You don't lose an edge by sharing how you think. You prove it.

What framework are you sitting on? Publish it this week.`,
    'agency': `Running content for clients taught me one uncomfortable truth:

Consistency beats brilliance, every single time.

The clients who grew weren't the ones with the cleverest posts in **{topic}**. They were the ones who showed up on a schedule, no exceptions.

So we built everything around rhythm: a month planned in one sitting, queued, and out the door automatically.

Brilliant-but-sporadic loses to good-but-relentless.

How are you protecting consistency when the week gets busy?`,
    'team-lead': `The best recruiting I ever did wasn't on a job board.

It was a post.

I shared how my team handled a hard call in **{topic}** - the tradeoffs, not just the win.

Three of my strongest hires later told me that post was why they applied.

Leading in public does two jobs at once: it sharpens your thinking and it shows the people you want to hire exactly what it's like to work with you.

Your team is watching. So are your future hires.

What's a lesson from this week worth sharing?`,
    'employee': `You don't need a huge following to get noticed at work.

You need to be visibly good at one thing.

For me that was **{topic}**. I started posting small, specific lessons from my actual job - nothing polished, just real.

A month in, two recruiters reached out and my manager started forwarding my posts internally.

Visibility isn't bragging. It's making your work legible to people who can open doors.

Pick one thing you did well this week. Write three sentences about how. Post it.`,
    'creator': `I spent a year chasing viral posts.

Then I looked at the data and felt a little dumb.

My biggest growth in **{topic}** didn't come from hot takes. It came from saveable, re-readable posts - the kind people send to a friend.

So I changed my goal from "get likes" to "get saved."

Followers went from 800 to five figures, and the audience was actually mine.

Reach is rented. Saves are owned.

What's one post you could make worth saving instead of just scrolling past?`,
}

export function fallbackPost(role: BrandingRole | undefined | null, topic?: string | null): string {
    const template = FALLBACK_POSTS[resolveRole(role)]
    const t = (topic ?? '').trim()
    return template.replace(/\{topic\}/g, t || 'your work')
}
