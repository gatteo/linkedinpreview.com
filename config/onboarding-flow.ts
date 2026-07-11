// ---------------------------------------------------------------------------
// Onboarding funnel content (design import: onboarding/flow/*)
//
// Everything the 17-step audit funnel renders that is not user data lives here:
// step/section metadata, stage imagery, the goal/voice/persona decks with their
// templated assistant reactions, topic suggestions, schedule presets, the
// benchmark charts, the audit-report framing, the paywall content, and the
// social-proof wall. PMs tune copy here without touching flow logic.
//
// Honesty rules (same as onboarding-personalization.ts):
// - Every number about THE USER is computed from fetched data or hidden.
// - Benchmarks/projections are framed as industry patterns or modeled figures.
// - Reviews and offer scarcity are marketing content (config-only, no user data).
// ---------------------------------------------------------------------------

import type { FastIdentity, InsightCategory, OnboardingInsights, RichSummary } from '@/types/onboarding'
import type { Tone } from '@/config/ai'
import type { Role } from '@/config/onboarding-personalization'
import type { DayOfWeek, ScheduleSlot, StrategyAudience, StrategyGoal } from '@/lib/strategy'

// --- Steps, sections, and the analysis rail --------------------------------

export const OB_SECTIONS = [
    { name: 'Connect', ids: ['welcome', 'connect', 'fetching', 'reassure'] },
    { name: 'Personalize your profile', ids: ['goal', 'persona', 'recap', 'proof'] },
    { name: 'Personalize your content', ids: ['voice', 'topics', 'schedule', 'reinforce'] },
    { name: 'Audit & plan', ids: ['building', 'reveal', 'buildplan', 'paywall', 'confirm'] },
] as const

export type ObLayout = 'hero' | 'split' | 'report'

type ObStepMeta = {
    layout: ObLayout
    /** Analysis-rail progress (latency mask); absent = rail hidden. */
    railPct?: number
    /** "1 / 5" question counter, or 'audit' for the finalizing state. */
    rail?: string
    /** Stage illustration (split/hero layouts). */
    stage?: { img: string; focus: string }
}

export const OB_STEP_META: Record<string, ObStepMeta> = {
    welcome: { layout: 'hero', stage: { img: 'valley-fog.jpg', focus: '50% 55%' } },
    connect: { layout: 'split', stage: { img: 'lighthouse.jpg', focus: '60% 50%' } },
    fetching: { layout: 'split', stage: { img: 'night-landscape.jpg', focus: '50% 45%' } },
    reassure: { layout: 'split', stage: { img: 'coastal-cypress.jpg', focus: '40% 50%' } },
    goal: { layout: 'split', railPct: 22, rail: '1 / 5', stage: { img: 'rolling-hills-wide.jpg', focus: '60% 55%' } },
    persona: { layout: 'split', railPct: 39, rail: '2 / 5', stage: { img: 'tuscan-hills.jpg', focus: '50% 55%' } },
    recap: { layout: 'split', stage: { img: 'calm-hills-2.jpg', focus: '50% 55%' } },
    proof: { layout: 'split', stage: { img: 'rolling-hills-wide-2.jpg', focus: '50% 50%' } },
    voice: { layout: 'split', railPct: 57, rail: '3 / 5', stage: { img: 'calm-hills-1.jpg', focus: '50% 55%' } },
    topics: { layout: 'split', railPct: 74, rail: '4 / 5', stage: { img: 'coastal-cypress.jpg', focus: '55% 50%' } },
    schedule: { layout: 'split', railPct: 88, rail: '5 / 5', stage: { img: 'calm-hills-2.jpg', focus: '55% 55%' } },
    reinforce: { layout: 'split', stage: { img: 'hot-air-balloon.jpg', focus: '45% 50%' } },
    building: { layout: 'split', railPct: 100, rail: 'audit', stage: { img: 'tuscan-hills.jpg', focus: '50% 60%' } },
    reveal: { layout: 'report' },
    buildplan: { layout: 'split', stage: { img: 'rolling-hills-wide.jpg', focus: '55% 50%' } },
    paywall: { layout: 'report' },
    confirm: { layout: 'split', stage: { img: 'sailboat.jpg', focus: '55% 50%' } },
}

export function sectionFor(stepId: string): { name: string; index: number; count: number } | null {
    const idx = OB_SECTIONS.findIndex((s) => (s.ids as readonly string[]).includes(stepId))
    if (idx < 0) return null
    return { name: OB_SECTIONS[idx].name, index: idx + 1, count: OB_SECTIONS.length }
}

// --- Assistant reactions (instant, templated - never a spinner on a tap) ----

export type ObReaction = { lead: string; body: string }

// --- Goals (screen 04) ------------------------------------------------------

export type ObGoalId = 'inbound' | 'authority' | 'hiring' | 'brand'

export type ObGoal = {
    id: ObGoalId
    icon: string
    title: string
    desc: string
    goal: StrategyGoal
    audience: StrategyAudience[]
    /** Goal restated for copy ("Everything to {restated}"). */
    restated: string
    /** Pricing headline on the paywall. */
    priceLine: string
    reaction: ObReaction
}

export const OB_GOALS: ObGoal[] = [
    {
        id: 'inbound',
        icon: 'Target',
        title: 'Inbound leads & customers',
        desc: 'Turn posts into demand and demos',
        goal: 'revenue-growth',
        audience: ['new-clients'],
        restated: 'win more inbound leads',
        priceLine: 'The first client you close pays for it 10 times over.',
        reaction: {
            lead: 'Inbound leads.',
            body: "Smart, {first}, that's the highest-ROI goal on LinkedIn, and the one most people are too timid to optimize for. We'll turn your posts into demand.",
        },
    },
    {
        id: 'authority',
        icon: 'TrendingUp',
        title: 'Followers & authority',
        desc: 'Grow reach, become a go-to voice',
        goal: 'media-pr',
        audience: ['partners'],
        restated: 'grow your reach and authority',
        priceLine: 'One post that travels pays for a year of this.',
        reaction: {
            lead: 'Followers & authority.',
            body: 'Reach compounds: every post makes the next one travel further. We’ll build you a voice people come looking for.',
        },
    },
    {
        id: 'hiring',
        icon: 'Users',
        title: 'Hiring & network',
        desc: 'Attract talent and the right people',
        goal: 'employer-branding',
        audience: ['talents'],
        restated: 'attract the right people',
        priceLine: 'One great hire pays for this a hundred times over.',
        reaction: {
            lead: 'Hiring & network.',
            body: 'People join people, not job posts. We’ll make your feed the reason great candidates reach out first.',
        },
    },
    {
        id: 'brand',
        icon: 'Sparkles',
        title: 'Personal brand',
        desc: 'Build a reputation that compounds',
        goal: 'company-awareness',
        audience: ['new-clients'],
        restated: 'build a brand that compounds',
        priceLine: 'Your reputation compounds. Start it this week.',
        reaction: {
            lead: 'Personal brand.',
            body: 'The best time to start was two years ago. The second best is this week, and now you have a system for it.',
        },
    },
]

export function obGoal(id: ObGoalId | undefined | null): ObGoal {
    return OB_GOALS.find((g) => g.id === id) ?? OB_GOALS[0]
}

/** Back-map a stored StrategyGoal to the option deck (resume + prefill). */
export function obGoalFromStrategy(goal: StrategyGoal | undefined | null): ObGoal | null {
    return OB_GOALS.find((g) => g.goal === goal) ?? null
}

// --- Persona (screen 05) ----------------------------------------------------

export const OB_ROLE_ICONS: Record<Role, string> = {
    'founder': 'Zap',
    'freelancer': 'PenLine',
    'team-lead': 'Users',
    'employee': 'FileText',
    'creator': 'Sparkles',
    'consultant': 'Lightbulb',
    'agency': 'Target',
}

export function personaReaction(roleLabel: string, niche: string): ObReaction {
    return {
        lead: `${roleLabel}${niche ? ` in ${niche}` : ''}.`,
        body: 'Perfect, we’ll tune every angle and CTA to how people like you win attention on LinkedIn.',
    }
}

// --- Voices (screen 08) -----------------------------------------------------

export type ObVoiceId = 'direct' | 'warm' | 'analytical' | 'contrarian'

export type ObVoice = {
    id: ObVoiceId
    icon: string
    title: string
    desc: string
    tone: Tone
    reaction: ObReaction
}

export const OB_VOICES: ObVoice[] = [
    {
        id: 'direct',
        icon: 'Zap',
        title: 'Direct & punchy',
        desc: 'Short lines. Zero fluff. Strong takes.',
        tone: 'professional',
        reaction: {
            lead: 'Direct & punchy.',
            body: 'Perfect, short lines get read to the end, and the end is where readers act.',
        },
    },
    {
        id: 'warm',
        icon: 'Heart',
        title: 'Warm & story-driven',
        desc: 'Personal stories that build trust.',
        tone: 'storytelling',
        reaction: {
            lead: 'Warm & story-driven.',
            body: 'Stories are the highest-trust format on LinkedIn. People remember how you made them feel.',
        },
    },
    {
        id: 'analytical',
        icon: 'BarChart3',
        title: 'Analytical & data-heavy',
        desc: 'Frameworks, numbers, receipts.',
        tone: 'educational',
        reaction: {
            lead: 'Analytical & data-heavy.',
            body: 'Receipts build authority faster than opinions. We’ll pair your numbers with hooks that travel.',
        },
    },
    {
        id: 'contrarian',
        icon: 'Flame',
        title: 'Contrarian & bold',
        desc: 'Challenge the consensus, spark debate.',
        tone: 'inspirational',
        reaction: {
            lead: 'Contrarian & bold.',
            body: 'Bold takes travel furthest. We’ll make sure yours land with substance behind them.',
        },
    },
]

export function obVoice(id: ObVoiceId | undefined | null): ObVoice {
    return OB_VOICES.find((v) => v.id === id) ?? OB_VOICES[0]
}

export function obVoiceFromTone(tone: Tone | undefined | null): ObVoice | null {
    return OB_VOICES.find((v) => v.tone === tone) ?? null
}

// --- Topics (screen 09) -----------------------------------------------------

const DEFAULT_TOPIC_SUGGESTIONS = ['Audience growth', 'Storytelling', 'Lessons learned', 'Industry trends']

/** Dashed "add" chips, keyed by the niche picked on the persona step. */
export const NICHE_TOPIC_SUGGESTIONS: Record<string, string[]> = {
    'B2B SaaS': ['Building in public', 'Pricing & packaging', 'Churn & retention', 'Product-led growth'],
    'Marketing & growth': ['Creator economy', 'Audience growth', 'Storytelling', 'Campaign teardowns'],
    'Sales': ['Outbound that works', 'Discovery calls', 'Negotiation', 'Social selling'],
    'Product management': ['Roadmap decisions', 'User research', 'Stakeholder management', 'Shipping culture'],
    'Software engineering': ['Engineering culture', 'AI & software', 'Career growth', 'System design'],
    'Design & UX': ['Design process', 'Portfolio breakdowns', 'Design systems', 'UX research'],
    'Data & AI': ['AI in practice', 'Data storytelling', 'ML systems', 'Analytics culture'],
    'Finance & fintech': ['Market analysis', 'Personal finance', 'Fintech trends', 'Fundraising'],
    'HR & recruiting': ['Hiring playbooks', 'Company culture', 'Candidate experience', 'Leadership'],
    'Leadership & management': ['Team rituals', 'Hard decisions', 'Feedback culture', 'Hiring'],
    'Startups & entrepreneurship': ['Building in public', 'Fundraising', 'Founder lessons', 'Go-to-market'],
    'Consulting': ['Frameworks', 'Client stories', 'Positioning', 'Pricing your work'],
    'E-commerce': ['Conversion optimization', 'Brand building', 'Retention & email', 'Operations'],
    'Real estate': ['Market insights', 'Deal breakdowns', 'Client stories', 'Local expertise'],
    'Healthcare': ['Patient experience', 'Health innovation', 'Career in healthcare', 'Research explained'],
    'Coaching': ['Client transformations', 'Frameworks', 'Mindset', 'Behind the practice'],
    'Career development': ['Job search tactics', 'Interview prep', 'Salary negotiation', 'Skill building'],
    'Content creation': ['Creator economy', 'Audience growth', 'Storytelling', 'Monetization'],
}

export function topicSuggestionsFor(niche: string | undefined | null, exclude: string[]): string[] {
    const base = (niche && NICHE_TOPIC_SUGGESTIONS[niche]) || DEFAULT_TOPIC_SUGGESTIONS
    const lower = exclude.map((t) => t.toLowerCase())
    return base.filter((t) => !lower.includes(t.toLowerCase()))
}

export function topicsReaction(count: number): ObReaction {
    if (count <= 1)
        return {
            lead: 'One pillar. Bold.',
            body: 'Total focus compounds fastest, and you can widen later once it works.',
        }
    if (count <= 3)
        return {
            lead: `${count} pillars. Perfect.`,
            body: 'This is the focus that compounds. Every post reinforces the last.',
        }
    return {
        lead: `${count} pillars is a lot.`,
        body: 'The accounts that grow fastest own 2 or 3. Consider trimming so every post reinforces the last.',
    }
}

// --- Schedule (screen 10) ---------------------------------------------------

const DAY_SPREADS: DayOfWeek[][] = [
    [],
    ['tue'],
    ['tue', 'thu'],
    ['mon', 'wed', 'fri'],
    ['mon', 'tue', 'thu', 'fri'],
    ['mon', 'tue', 'wed', 'thu', 'fri'],
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
]

export function suggestedDays(frequency: number): DayOfWeek[] {
    return DAY_SPREADS[Math.min(7, Math.max(1, Math.round(frequency)))] ?? DAY_SPREADS[3]
}

/** "Choose for me": a rhythm tuned to the goal. */
export function frequencyForGoal(goal: ObGoalId | undefined | null): number {
    if (goal === 'authority' || goal === 'inbound') return 4
    if (goal === 'hiring') return 2
    return 3
}

export const DEFAULT_SLOT: ScheduleSlot = { time: '09:00', days: ['mon', 'wed', 'fri'] }

const DAY_LABEL: Record<DayOfWeek, string> = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
}

export function scheduleReaction(frequency: number, days: DayOfWeek[]): ObReaction {
    const dayList = days.map((d) => DAY_LABEL[d]).join(', ')
    const lead = `${frequency}× a week${dayList ? `, ${dayList}` : ''}.`
    if (frequency <= 1) return { lead, body: 'A steady start. One great post a week beats four rushed ones.' }
    if (frequency === 2) return { lead, body: 'Sustainable and steady, a rhythm your audience can rely on.' }
    if (frequency === 3) return { lead, body: 'Growth mode: the sweet spot for momentum without the burnout.' }
    if (frequency === 4) return { lead, body: 'Aggressive growth. With posts pre-written, this stops being scary.' }
    return { lead, body: 'Full send. We’ll keep the queue loaded so the pace never depends on your mood.' }
}

// --- Reinforce (screen 11) --------------------------------------------------

/** Est. monthly impressions by posting frequency - an industry-benchmark curve. */
export const REINFORCE_CHART: { n: number; label: string; height: number }[] = [
    { n: 1, label: '4k', height: 22 },
    { n: 2, label: '11k', height: 40 },
    { n: 3, label: '28k', height: 66 },
    { n: 4, label: '47k', height: 84 },
    { n: 5, label: '71k', height: 100 },
]

// --- Loader checklists ------------------------------------------------------

export const FETCHING_TASKS = [
    'Fetching your profile',
    'Reading your recent posts',
    'Detecting your language',
    'Mapping your topics',
]

export const BUILDING_TASKS = [
    'Scoring your recent posts',
    'Mapping your pillar mix',
    'Finding your content gaps',
    'Compiling your report',
]

export const BUILDPLAN_TASKS = [
    'Applying the fixes we found',
    'Formulating your content strategy',
    'Filling your 90-day calendar',
    'Loading your first post ideas',
    'Tuning your best times to post',
]

// --- Commitment popup (screen 14) -------------------------------------------

export const COMMITMENT_OPTIONS = ['Today', 'This week', 'This month', 'Not sure yet'] as const
export type Commitment = (typeof COMMITMENT_OPTIONS)[number]

// --- Social proof -----------------------------------------------------------

export type ObTestimonial = {
    name: string
    role: string
    /** Follower label shown next to the name (marketing content). */
    followers?: string
    quote?: string
    /** Metric rows for result cards: [label, value]. */
    result?: [string, string][]
    /** /images/reviews/<avatar> - real photo; absent = on-brand initials. */
    avatar?: string
    /** /images/reviews/<shot> - LinkedIn analytics screenshot. */
    shot?: string
}

// Identities + photos supplied by the team (tmp/reviews); quotes and results
// are illustrative marketing content, not computed metrics.
export const OB_TESTIMONIALS: ObTestimonial[] = [
    {
        name: 'Matteo Bossolini',
        role: 'Co-founder, Cato',
        followers: '3.1k',
        quote: 'Two inbound demos in my first week. I stopped dreading the blank page.',
        avatar: 'matteo-bossolini.jpg',
        shot: 'shot-1.png',
    },
    {
        name: 'Sandra Yvonne Alvarez',
        role: 'Founder, OmniLiv',
        followers: '5.4k',
        quote: 'It finally sounds like me on a good day. Clients actually reply now.',
        avatar: 'sandra.png',
    },
    {
        name: 'Rui Tong',
        role: 'Engineer, Google',
        followers: '2.8k',
        result: [
            ['Impressions', '+34%'],
            ['Engagement', '+51%'],
        ],
        avatar: 'rui-tong.jpg',
    },
    {
        name: 'Jonathan Le Roux',
        role: 'Research lead',
        followers: '4.9k',
        quote: 'A month of posts planned in one sitting. The consistency did the rest.',
        avatar: 'jonathan.jpg',
        shot: 'shot-2.png',
    },
    {
        name: 'Susan Nothnagel',
        role: 'Consultant',
        followers: '7.7k',
        quote: 'A retainer client came in from a post I wrote in ten minutes.',
        avatar: 'susan.jpg',
    },
    {
        name: 'Christine Kaeser-Chen',
        role: 'Research engineer',
        followers: '6.2k',
        quote: 'From lurker to three posts a week. My DMs are finally interesting.',
        avatar: 'christine.jpg',
    },
    {
        name: 'Quan Wang',
        role: 'Tech lead & instructor',
        followers: '11k',
        result: [
            ['Profile views', '+210%'],
            ['Post clicks', '+51%'],
        ],
        avatar: 'quan-wang.jpg',
        shot: 'shot-6.png',
    },
    {
        name: 'Lymarie Molina',
        role: 'Proposal coordinator',
        followers: '1.9k',
        quote: 'A recruiter reached out about a role I never even applied for.',
        avatar: 'lymarie.jpg',
    },
    {
        name: 'Julius Richter',
        role: 'Researcher, MERL',
        followers: '3.4k',
        quote: 'My reply rate tripled once the posts sounded human.',
        avatar: 'julius.jpg',
    },
    {
        name: 'Matteo Vallebona',
        role: 'Product specialist',
        followers: '2.1k',
        quote: 'The hardest part used to be starting. Now it takes ten minutes.',
        avatar: 'matteo-vallebona.jpg',
    },
    {
        name: 'Nina Petrova',
        role: 'Coach',
        followers: '9.3k',
        quote: 'From 90 followers watching to a real waitlist. Wild.',
    },
    {
        name: 'Tom Hansen',
        role: 'Sales lead',
        followers: '6.7k',
        result: [
            ['Inbound leads', '5x'],
            ['Saves', '+88%'],
        ],
        shot: 'shot-7.png',
    },
    {
        name: 'Giulia Ferrari',
        role: 'Founder',
        followers: '2.1k',
        quote: 'Closed a client worth a year of retainers straight from a single post.',
    },
    {
        name: 'Omar Haddad',
        role: 'Agency owner',
        followers: '8.8k',
        quote: 'Two discovery calls booked from one carousel. First week.',
    },
]

/** Paywall wall: image-rich reordering of the same identities. */
export const OB_PW_TESTIMONIALS: ObTestimonial[] = [
    OB_TESTIMONIALS[1],
    { ...OB_TESTIMONIALS[0], shot: 'shot-4.png' },
    OB_TESTIMONIALS[10],
    { ...OB_TESTIMONIALS[2], shot: 'shot-3.png' },
    OB_TESTIMONIALS[8],
    OB_TESTIMONIALS[4],
    { ...OB_TESTIMONIALS[12], shot: 'shot-5.png' },
    OB_TESTIMONIALS[5],
    OB_TESTIMONIALS[11],
    OB_TESTIMONIALS[7],
    OB_TESTIMONIALS[13],
    OB_TESTIMONIALS[9],
]

/** Marketing counters for the proof/awards blocks (config-only). */
export const OB_PROOF = {
    helpedCount: '11,400+',
    professionals: '12,000+',
    reviewsLine: '2,000+ reviews',
}

// --- Audit report (screen 13) ------------------------------------------------

/** Radar axes: the 4 pillars we can actually measure from the labeled mix. */
export const AUDIT_AXES: { key: InsightCategory; label: string }[] = [
    { key: 'personal-story', label: 'Personal' },
    { key: 'educational', label: 'Educational' },
    { key: 'promotional', label: 'Promotional' },
    { key: 'opinion', label: 'Opinion' },
]

/** The ideal pillar mix (industry framing), same axis order. */
export const AUDIT_IDEAL_MIX = [40, 35, 10, 15]

/** The user's mix over the 4 axes, normalized from the labeled categories. */
export function auditMix(insights: OnboardingInsights): number[] | null {
    if (insights.kind !== 'posts' || !insights.mix.length) return null
    const byCategory = new Map(insights.mix.map((m) => [m.category, m.count]))
    const counts = AUDIT_AXES.map((a) => byCategory.get(a.key) ?? 0)
    const total = counts.reduce((a, b) => a + b, 0)
    if (total === 0) return null
    return counts.map((c) => Math.round((c / total) * 100))
}

/**
 * Percentile framing for the report hero - a deterministic tier from the two
 * real signals we have (followers + observed cadence), framed vs. benchmarks.
 */
export function auditPercentile(summary: RichSummary | null | undefined): string {
    const followers = summary?.followers ?? 0
    const perWeek = summary?.observed?.postsPerWeek ?? 0
    let score = 0
    if (followers >= 500) score += 1
    if (followers >= 2000) score += 1
    if (followers >= 10000) score += 1
    if (perWeek >= 0.5) score += 1
    if (perWeek >= 2) score += 1
    const tiers = ['Top 60%', 'Top 50%', 'Top 40%', 'Top 30%', 'Top 20%', 'Top 10%']
    return tiers[Math.min(score, tiers.length - 1)]
}

/** Strength curve + tag for the topics section (rank-based presentation). */
export function topicStrengths(topics: string[]): { topic: string; strength: number; tag: string }[] {
    const curve = [100, 62, 38, 24, 16]
    return topics.slice(0, 5).map((topic, i) => ({
        topic,
        strength: curve[i] ?? 12,
        tag: i === 0 ? 'your wedge' : i === 1 ? '2nd strongest' : 'dilutes focus',
    }))
}

export const AUDIT_FIXES = {
    strategy:
        'Our 4-pillar system rebalances you toward the mix that converts, so every post has a job instead of adding noise.',
    traction: 'We pre-write and schedule your posts, so showing up every week stops depending on motivation.',
    content:
        'Every draft we hand you opens on a hook, stays tight, and ends on a question engineered to pull comments.',
    topics: 'We anchor you on your wedge and rotate the rest in to stay fresh without losing focus.',
}

// --- Paywall content (screen 15) ---------------------------------------------

export type ObFeature = { art?: 'ai' | 'preview' | 'calendar' | 'analytics'; icon: string; title: string; desc: string }

export const OB_FEATURES: ObFeature[] = [
    {
        art: 'ai',
        icon: 'PenLine',
        title: 'AI that writes as you',
        desc: 'Drafts in your voice from your pillars - never generic AI, never a blank page.',
    },
    {
        art: 'preview',
        icon: 'Eye',
        title: 'Pixel-perfect preview',
        desc: 'Know exactly how a post looks on desktop and mobile before it ships.',
    },
    {
        art: 'calendar',
        icon: 'CalendarDays',
        title: 'Scheduling calendar',
        desc: 'See what is queued, in review, and ready to go across the week.',
    },
    {
        art: 'analytics',
        icon: 'BarChart3',
        title: 'Powerful analytics',
        desc: 'See what worked, spot the patterns, and shape your next post.',
    },
]

export const OB_FEATURES_MORE: ObFeature[] = [
    { icon: 'Clock', title: 'Best time to post', desc: 'We pick the slots your audience is actually online.' },
    { icon: 'Zap', title: 'One-click queue', desc: 'Fill a whole week of posts in a single click.' },
    { icon: 'Link', title: 'Shareable drafts', desc: 'Send a draft out for feedback with one link.' },
    { icon: 'Lightbulb', title: 'Weekly post ideas', desc: 'Fresh, personalized ideas based on live trends.' },
]

/** The 4 pillar-tagged post previews ("already written in your voice"). */
export const OB_IDEA_PILLARS: { key: string; tag: string; label: string; color: string; category: InsightCategory }[] =
    [
        {
            key: 'personal',
            tag: 'PERSONAL',
            label: 'Your story',
            color: 'var(--petrol-500)',
            category: 'personal-story',
        },
        { key: 'educational', tag: 'EDUCATIONAL', label: 'Playbook', color: 'var(--info)', category: 'educational' },
        { key: 'opinion', tag: 'OPINION', label: 'Hot take', color: 'var(--green)', category: 'opinion' },
        {
            key: 'promotional',
            tag: 'PROMOTIONAL',
            label: 'Customer win',
            color: 'var(--orange-500)',
            category: 'promotional',
        },
    ]

export type GrowthCardData = {
    label: string
    from: string
    toNum: number
    fmt: (v: number) => string
    pct: string
    shape: number[]
}

const compact = (v: number): string =>
    v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : Math.round(v).toString()

/**
 * "Your numbers, 90 days from now" - modeled projections. Where a real number
 * exists (followers, observed cadence) it seeds the "from" side; the "to" side
 * is always a modeled multiple, labeled as such on screen.
 */
export function growthCards(
    summary: RichSummary | null | undefined,
    targetPerWeek: number,
    goalId: ObGoalId | undefined | null,
): GrowthCardData[] {
    const followers = summary?.followers ?? null
    const fromFollowers = followers && followers > 0 ? followers : 500
    const toFollowers = Math.round(fromFollowers * 2.8)

    const impressionsFor = (perWeek: number): number => {
        const bench = [0, 4000, 11000, 28000, 47000, 71000]
        const idx = Math.min(5, Math.max(0, Math.round(perWeek)))
        return bench[idx]
    }
    const observedPerWeek = summary?.observed?.postsPerWeek ?? 0
    const fromImpressions = Math.max(1000, impressionsFor(observedPerWeek))
    const toImpressions = Math.max(fromImpressions * 2, impressionsFor(targetPerWeek))

    const fromViews = Math.max(10, Math.round(fromFollowers * 0.013))
    const toViews = Math.round(fromViews * 5.5)

    const goalCard: GrowthCardData =
        goalId === 'hiring'
            ? {
                  label: 'Qualified applicants / mo',
                  from: '0',
                  toNum: 6,
                  fmt: (v) => Math.round(v).toString(),
                  pct: 'from zero',
                  shape: [0, 0.01, 0.03, 0.06, 0.11, 0.19, 0.35, 0.63, 1],
              }
            : goalId === 'authority' || goalId === 'brand'
              ? {
                    label: 'New followers / mo',
                    from: '0',
                    toNum: Math.max(300, Math.round(fromFollowers * 0.55)),
                    fmt: compact,
                    pct: 'compounding',
                    shape: [0, 0.02, 0.05, 0.1, 0.18, 0.3, 0.48, 0.72, 1],
                }
              : {
                    label: 'Inbound leads / mo',
                    from: '0',
                    toNum: 14,
                    fmt: (v) => Math.round(v).toString(),
                    pct: 'from zero',
                    shape: [0, 0.01, 0.03, 0.06, 0.11, 0.19, 0.35, 0.63, 1],
                }

    const pctOf = (from: number, to: number) => `+${Math.round(((to - from) / from) * 100)}%`
    // A % only reads as "yours" when the baseline is a real measured number;
    // a floor/baseline seed gets a neutral "modeled" tag instead.
    const followersReal = followers !== null && followers > 0
    const cadenceReal = summary?.observed?.postsPerWeek != null

    return [
        {
            label: 'Followers',
            from: compact(fromFollowers),
            toNum: toFollowers,
            fmt: compact,
            pct: followersReal ? pctOf(fromFollowers, toFollowers) : 'modeled',
            shape: [0.05, 0.11, 0.19, 0.28, 0.4, 0.52, 0.68, 0.85, 1],
        },
        {
            label: 'Est. monthly impressions',
            from: compact(fromImpressions),
            toNum: toImpressions,
            fmt: compact,
            pct: cadenceReal ? pctOf(fromImpressions, toImpressions) : 'modeled',
            shape: [0.04, 0.07, 0.12, 0.19, 0.29, 0.42, 0.58, 0.79, 1],
        },
        {
            label: 'Profile views / week',
            from: fromViews.toString(),
            toNum: toViews,
            fmt: (v) => Math.round(v).toString(),
            // Always derived (LinkedIn doesn't expose this publicly), never "yours".
            pct: 'modeled',
            shape: [0.03, 0.05, 0.08, 0.13, 0.2, 0.3, 0.46, 0.71, 1],
        },
        goalCard,
    ]
}

/** Languages label for the recap sentence + paywall line ("English & Italian"). */
export function languagesLabel(identity: FastIdentity | undefined | null): string {
    const names = (identity?.languages ?? []).map((l) => l.name).filter(Boolean)
    if (names.length === 0) return ''
    return names.slice(0, 2).join(' & ')
}

/** Two-letter language codes for the bilingual paywall benefit ("IT/EN"). */
const LANGUAGE_CODES: Record<string, string> = {
    english: 'EN',
    italian: 'IT',
    spanish: 'ES',
    french: 'FR',
    german: 'DE',
    portuguese: 'PT',
    dutch: 'NL',
}

export function languageCodePair(identity: FastIdentity | undefined | null): string | null {
    const names = (identity?.languages ?? []).map((l) => l.name.toLowerCase())
    const codes = names.map((n) => LANGUAGE_CODES[n]).filter(Boolean)
    if (codes.length < 2) return null
    return `${codes[1]}/${codes[0]}`
}

// --- Offer scarcity (config-only marketing content) --------------------------

export const OB_TICKET = {
    badge: 'Lifetime Founder Pass',
    /** Fictional pass counter (marketing framing, never user data). */
    passNumber: '#2,848',
    passTotal: '/ 3,000',
    spotsStart: 152,
    spotsFloor: 118,
    spotsPct: '94.9%',
    /** The post-founding price the stub warns about. */
    nextPrice: '$49',
}
