'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { AnchorIcon, MessageSquareIcon, RulerIcon, type LucideIcon } from 'lucide-react'

import type { OnboardingInsights } from '@/types/onboarding'
import { AUDIT_FIXES, AUDIT_IDEAL_MIX, auditMix, auditPercentile, topicStrengths } from '@/config/onboarding-flow'
import { GOAL_GAP, goalRestated, INSIGHT_CATEGORY_LABELS, resolveRole } from '@/config/onboarding-personalization'
import { EASE_OUT } from '@/lib/motion'
import { cn } from '@/lib/utils'

import { fetchInsights, track } from '../ai'
import { Radar } from '../charts'
import { useOnboarding } from '../context'
import { firstName, H1, PersonAvatar, RingSpinner, Sub, timeAgoLabel } from '../primitives'
import { ScrollProgressButton } from '../scroll-progress-button'
import type { OnboardingAnswers } from '../types'
import { useScrollGate } from '../use-scroll-gate'

// ---------------------------------------------------------------------------
// 13 · Reveal - the audit report: four numbered sections, each pairing a
// problem the analysis actually found with the fix the product ships. Every
// number is a server-counted measurement or a benchmark; degraded kinds
// (profile/benchmark) swap to honest variants that never claim post data,
// and healthy metrics get positive framing instead of manufactured deficits.
// ---------------------------------------------------------------------------

// Generation runs server-side in the background (fetchInsights polls for it),
// so waiting here can actually pay off - but past this the user reads the
// benchmark report rather than a spinner. The payload still persists for later.
const LOADER_FAILSAFE_MS = 30_000
const DORMANT_AFTER_DAYS = 45

/** No server payload is coming (or it failed): honest benchmark content. */
function localBenchmark(answers: OnboardingAnswers): OnboardingInsights {
    const goal = answers.primaryGoal ?? answers.goals[0]
    const gap = GOAL_GAP[goal ?? 'revenue-growth'] ?? GOAL_GAP['revenue-growth']
    return {
        kind: 'benchmark',
        observed: { postsAnalyzed: null, postsLast30d: null, postsPerWeek: null, newestPostAt: null, followers: null },
        mix: [],
        dominant: null,
        missing: [gap],
        currentTopics: answers.topics,
        adjacentTopics: [],
        voice: { tone: '', excerpt: null },
        headline: `You told us you want to ${goalRestated(goal)}. The content most associated with that is ${INSIGHT_CATEGORY_LABELS[gap.category].toLowerCase()} posts.`,
        generatedAt: '',
    }
}

export function RevealStep() {
    const { answers, update, goNext } = useOnboarding()
    const [timedOut, setTimedOut] = React.useState(false)
    // Once the report is on screen its content is frozen for this mount: a
    // payload that lands late must not swap sections mid-read.
    const [frozen, setFrozen] = React.useState<OnboardingInsights | null>(null)

    const expecting =
        !answers.insights &&
        answers.insightsStatus !== 'failed' &&
        !!answers.richStatus &&
        answers.richStatus !== 'idle'
    const waiting = expecting && !timedOut && !frozen

    // Guaranteed trigger of last resort: the user is on the reveal and mounted,
    // so drive the generation from here even if every earlier trigger (the
    // pipeline effect, the building step) missed. Idempotent server-side + a
    // client dedupe, so this just retrieves whatever is already running rather
    // than starting a second run. Only when a scrape/enrich ran and the goal/role
    // framing exists; pure-manual users correctly keep the benchmark.
    const drivenRef = React.useRef(false)
    React.useEffect(() => {
        if (drivenRef.current) return
        const goal = answers.primaryGoal ?? answers.goals[0]
        if (answers.insights || !answers.richStatus || answers.richStatus === 'idle' || !goal || !answers.role) return
        drivenRef.current = true
        fetchInsights({ primaryGoal: goal, niche: answers.niche || undefined, role: resolveRole(answers.role) }).then(
            (payload) => {
                if (payload) update({ insights: payload, insightsStatus: 'ready' })
                else update({ insightsStatus: 'failed' })
            },
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
        if (!waiting) return
        const t = setTimeout(() => setTimedOut(true), LOADER_FAILSAFE_MS)
        return () => clearTimeout(t)
    }, [waiting])

    React.useEffect(() => {
        if (waiting || frozen) return
        setFrozen(answers.insights ?? localBenchmark(answers))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [waiting, frozen])

    const insights = frozen ?? answers.insights ?? localBenchmark(answers)

    React.useEffect(() => {
        if (waiting) return
        track('onb_reveal_view', { kind: insights.kind, postsAnalyzed: insights.observed.postsAnalyzed })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [waiting])

    if (waiting) {
        return (
            <div className='flex flex-col items-center gap-5 py-16 text-center'>
                <RingSpinner />
                <H1 className='mb-0 text-xl'>Finishing your audit…</H1>
                <Sub className='mx-auto mb-0 max-w-[320px] text-center'>
                    We&rsquo;re reading your recent posts to see what&rsquo;s working and what&rsquo;s missing.
                </Sub>
            </div>
        )
    }

    return (
        <AuditReport
            answers={answers}
            insights={insights}
            onContinue={() => {
                track('onb_reveal_continue')
                goNext()
            }}
        />
    )
}

// ── Report body: scroll-revealed sections + a scroll-gated CTA ───────────────

function AuditReport({
    answers,
    insights,
    onContinue,
}: {
    answers: OnboardingAnswers
    insights: OnboardingInsights
    onContinue: () => void
}) {
    const fn = firstName(answers.profile.name)
    const isPosts = insights.kind === 'posts'
    const posts = insights.observed.postsAnalyzed
    const percentile = auditPercentile(answers.richSummary)

    const anchorRef = React.useRef<HTMLDivElement>(null)
    const rectRef = React.useRef<SVGRectElement>(null)
    // Progress is applied straight to the border rect (no React state) so it
    // tracks the scroll frame-for-frame without re-rendering the whole report.
    const { atEnd } = useScrollGate(anchorRef, {
        endThreshold: 48,
        onProgress: (p) => {
            if (rectRef.current) rectRef.current.style.strokeDashoffset = String(1 - p)
        },
    })

    return (
        <div ref={anchorRef} className='flex flex-col'>
            <div className='mb-3 text-center'>
                <div className='mb-3 flex justify-center'>
                    <PersonAvatar name={answers.profile.name} src={answers.profile.avatarUrl} size={54} ring />
                </div>
                <h1 className='font-heading mb-2 text-[23px] font-semibold tracking-[-0.02em]'>
                    {isPosts
                        ? `${percentile}. Strong work${fn ? `, ${fn}` : ''}.`
                        : `Your starting point${fn ? `, ${fn}` : ''}.`}
                </h1>
                <p className='text-muted-foreground mx-auto max-w-[42ch] text-[13.5px] leading-normal'>
                    {isPosts
                        ? `I analyzed your ${posts} most recent posts. Here is exactly what I found, and how we fix it.`
                        : 'I read your profile and your goal. Here is where we would start, and how we fix it.'}
                </p>
            </div>

            <div className='pt-1'>
                <Reveal>
                    <StrategySection insights={insights} />
                </Reveal>
                <Reveal>
                    <TractionSection answers={answers} insights={insights} />
                </Reveal>
                <Reveal>
                    <ContentSection answers={answers} insights={insights} />
                </Reveal>
                <Reveal>
                    <TopicsSection insights={insights} />
                </Reveal>
            </div>

            <div
                className='sticky bottom-0 z-10 -mx-[clamp(20px,4vw,40px)] mt-2 flex flex-col items-center gap-2 px-[clamp(20px,4vw,40px)] pt-10 pb-1'
                style={{ background: 'linear-gradient(to bottom, transparent, var(--card) 42%)' }}>
                <ScrollProgressButton rectRef={rectRef} atEnd={atEnd} onClick={onContinue}>
                    Create my plan
                </ScrollProgressButton>
                <span
                    className={cn(
                        'text-muted-foreground text-[11.5px] transition-opacity duration-300',
                        atEnd ? 'opacity-0' : 'opacity-100',
                    )}>
                    Scroll through your audit to continue
                </span>
            </div>
        </div>
    )
}

// ── Scroll-reveal wrapper: each section fades and rises as it enters view ────

function Reveal({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}>
            {children}
        </motion.div>
    )
}

// ── Section frame ───────────────────────────────────────────────────────────

function Section({
    num,
    label,
    head,
    copy,
    visual,
    fix,
}: {
    num: string
    label: string
    head: string
    copy: React.ReactNode
    visual?: React.ReactNode
    fix: string
}) {
    return (
        <div className='border-border border-t py-[18px]'>
            <div className='text-muted-foreground mb-2 font-mono text-[10.5px] tracking-[0.12em]'>
                {num} · {label}
            </div>
            <h3 className='font-heading mb-2 text-[17px] leading-[1.25] font-semibold tracking-[-0.01em]'>{head}</h3>
            <p className='text-muted-foreground mb-3 text-[13px] leading-[1.55] [&_b]:text-[var(--foreground)]'>
                {copy}
            </p>
            {visual && <div className='mb-3'>{visual}</div>}
            <div className='bg-accent border-primary/25 flex items-start gap-2.5 rounded-xl border px-[13px] py-[11px]'>
                <span className='bg-primary text-primary-foreground mt-px shrink-0 rounded-md px-[7px] py-[3px] font-mono text-[9.5px] font-bold tracking-[0.04em] uppercase'>
                    The fix
                </span>
                <p className='text-accent-foreground m-0 text-[12.5px] leading-normal'>{fix}</p>
            </div>
        </div>
    )
}

// ── 01 · Strategy ───────────────────────────────────────────────────────────

function StrategySection({ insights }: { insights: OnboardingInsights }) {
    const mix = auditMix(insights)
    return (
        <Section
            num='01'
            label='STRATEGY'
            head={
                insights.kind === 'posts'
                    ? "People don't fail from posting too little. They fail from posting random content."
                    : 'A strategy beats inspiration, every single week.'
            }
            copy={insights.headline}
            visual={mix ? <Radar mine={mix} ideal={AUDIT_IDEAL_MIX} /> : undefined}
            fix={AUDIT_FIXES.strategy}
        />
    )
}

// ── 02 · Traction ───────────────────────────────────────────────────────────

function isDormant(iso: string): boolean {
    return Date.now() - new Date(iso).getTime() > DORMANT_AFTER_DAYS * 86_400_000
}

// Reads-as-a-plural-noun labels for the engagement contrast sentence
// (INSIGHT_CATEGORY_LABELS glued before "posts" produces "stories posts").
const CATEGORY_PLURAL: Record<string, string> = {
    'personal-story': 'personal stories',
    'educational': 'educational posts',
    'opinion': 'opinion posts',
    'promotional': 'promotional posts',
    'engagement-social': 'social posts',
    'other': 'uncategorized posts',
}

function TractionSection({ answers, insights }: { answers: OnboardingAnswers; insights: OnboardingInsights }) {
    const observed = insights.observed
    const followers = observed.followers ?? answers.richSummary?.followers ?? null
    const perWeek = observed.postsPerWeek
    const last30 = observed.postsLast30d
    const newest = observed.newestPostAt
    const avgReactions = observed.avgReactions ?? null

    type Metric = { value: string; label: string; note: string; good: boolean }
    const metrics: Metric[] = []
    if (followers !== null && followers > 0) {
        metrics.push({
            value: followers >= 1000 ? `${(followers / 1000).toFixed(followers >= 10000 ? 0 : 1)}k` : `${followers}`,
            label: 'Followers',
            note: followers >= 2000 ? 'a real audience' : 'room to grow',
            good: followers >= 2000,
        })
    }
    if (avgReactions !== null) {
        metrics.push({
            value: `${avgReactions}`,
            label: 'Avg reactions / post',
            note: avgReactions >= 20 ? 'people respond to you' : 'room to grow',
            good: avgReactions >= 20,
        })
    }
    if (perWeek !== null) {
        metrics.push({
            value: `${perWeek}`,
            label: 'Posts / week',
            note:
                perWeek >= 3
                    ? 'in the sweet spot'
                    : perWeek >= 1.5
                      ? 'close to the sweet spot'
                      : 'below the 3-4 sweet spot',
            good: perWeek >= 3,
        })
    }
    if (newest) {
        metrics.push({
            value: timeAgoLabel(newest),
            label: 'Most recent post',
            note: isDormant(newest) ? 'gone quiet' : 'recently active',
            good: !isDormant(newest),
        })
    }
    if (last30 !== null) {
        metrics.push({
            value: `${last30}`,
            label: 'Posts, last 30 days',
            note: last30 >= 12 ? 'strong month' : last30 >= 6 ? 'decent month' : 'thin month',
            good: last30 >= 12,
        })
    }

    const healthy = perWeek !== null && perWeek >= 3
    const dormant = newest ? isDormant(newest) : false

    // Measured engagement contrast: both numbers are provider-scraped averages
    // over >= 2 posts each, so the ratio is a real observation, not a story.
    const byCategory = insights.engagement?.byCategory ?? []
    const top = byCategory[0]
    const bottom = byCategory[byCategory.length - 1]
    const engagementLine =
        top && bottom && top !== bottom && bottom.avgReactions > 0 && top.avgReactions >= bottom.avgReactions * 1.5
            ? ` Your ${CATEGORY_PLURAL[top.category]} pull ${(top.avgReactions / bottom.avgReactions).toFixed(1)}x the reactions of your ${CATEGORY_PLURAL[bottom.category]} - lean into what your audience already rewards.`
            : ''

    return (
        <Section
            num='02'
            label='TRACTION'
            head={
                healthy
                    ? 'Your rhythm is real. Now make every post pull its weight.'
                    : dormant
                      ? "You've gone quiet, and the feed forgets fast."
                      : "You haven't given LinkedIn enough to know who you are yet."
            }
            copy={
                metrics.length
                    ? (healthy
                          ? 'You already show up more than most. The gap is not effort, it is aim: pointing that consistency at content with a job.'
                          : 'Your posts hold up when you show up. The problem is you barely do, so your reach never gets to compound.') +
                      engagementLine
                    : 'We could not measure your posting rhythm this time, so hold these as the benchmarks to beat: 3 to 4 posts a week, every week.'
            }
            visual={
                metrics.length ? (
                    <div className='grid grid-cols-2 gap-2'>
                        {metrics.slice(0, 4).map((m, i) => (
                            <div key={i} className='bg-secondary border-border rounded-xl border px-[13px] py-3'>
                                <div className='font-heading text-2xl leading-none font-bold'>{m.value}</div>
                                <div className='text-muted-foreground mt-[7px] mb-[3px] font-mono text-[10px] tracking-[0.04em] uppercase'>
                                    {m.label}
                                </div>
                                <div
                                    className={cn(
                                        'text-[11.5px] font-semibold',
                                        m.good ? 'text-success' : 'text-[var(--orange-600)]',
                                    )}>
                                    {m.note}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : undefined
            }
            fix={AUDIT_FIXES.traction}
        />
    )
}

// ── 03 · Content ────────────────────────────────────────────────────────────

function ContentSection({ answers, insights }: { answers: OnboardingAnswers; insights: OnboardingInsights }) {
    const audit = insights.audit
    const styleHints = answers.richSummary?.styleHints

    type Flag = { icon: LucideIcon; k: string; line: string; good: boolean; score: number }
    const flags: Flag[] = []
    // Scores are deterministic from MEASURED data (counted ratios, corpus-derived
    // length category) - never LLM-authored - so a rating is always defensible.
    const ratioScore = (num: number, total: number) => Math.max(1, Math.round((num / Math.max(1, total)) * 10))
    if (audit) {
        const { withHook, total } = audit.hooks
        const goodHooks = withHook / Math.max(1, total) >= 0.5
        flags.push({
            icon: AnchorIcon,
            k: 'Hooks',
            line: goodHooks
                ? `${withHook} of ${total} posts open with a real hook. Keep that up - it is rarer than you think.`
                : `Only ${withHook} of ${total} posts opened with a real hook. The rest buried the point.`,
            good: goodHooks,
            score: ratioScore(withHook, total),
        })
    }
    if (styleHints) {
        const good = styleHints.sentenceLength !== 'long'
        flags.push({
            icon: RulerIcon,
            k: 'Length',
            line:
                styleHints.sentenceLength === 'long'
                    ? 'Your sentences run long. The posts that travel read in short, skimmable lines.'
                    : styleHints.sentenceLength === 'short'
                      ? 'You already write in short, punchy lines - exactly what the feed rewards.'
                      : 'Your sentence length is solid. Tightening the openers will sharpen it further.',
            good,
            score: styleHints.sentenceLength === 'long' ? 4 : styleHints.sentenceLength === 'short' ? 9 : 7,
        })
    }
    if (audit) {
        const { endingWithQuestion, total } = audit.ctas
        const goodCtas = endingWithQuestion / Math.max(1, total) >= 0.4
        flags.push({
            icon: MessageSquareIcon,
            k: 'CTAs',
            line: goodCtas
                ? `${endingWithQuestion} of ${total} posts end on a question - your comments have a reason to exist.`
                : endingWithQuestion === 0
                  ? `Zero of ${total} posts ended on a question. Comments stall without one.`
                  : `Only ${endingWithQuestion} of ${total} posts ended on a question. Comments stall without one.`,
            good: goodCtas,
            score: ratioScore(endingWithQuestion, total),
        })
    }

    if (!flags.length) {
        return (
            <Section
                num='03'
                label='CONTENT'
                head='Packaging decides who keeps reading.'
                copy='We could not score your recent posts this time, so we will enforce the three habits that decide reach: open on a hook, stay tight, end on a question.'
                fix={AUDIT_FIXES.content}
            />
        )
    }

    const allGood = flags.every((f) => f.good)
    return (
        <Section
            num='03'
            label='CONTENT'
            head={
                allGood
                    ? 'Your packaging is strong. Let’s protect it at volume.'
                    : 'Your posts are quietly working against themselves.'
            }
            copy={
                allGood
                    ? 'The habits are there. The system keeps them there when you triple your output.'
                    : 'Strong ideas, weak packaging. Fixable habits are capping everything you publish.'
            }
            visual={
                <div className='grid gap-2'>
                    {flags.map((f, i) => (
                        <div
                            key={i}
                            className='bg-secondary border-border flex items-start gap-[11px] rounded-xl border px-3 py-[11px]'>
                            <span className='text-primary mt-px flex shrink-0'>
                                <f.icon className='size-[17px]' />
                            </span>
                            <div>
                                <b className='block text-[12.5px] font-semibold'>{f.k}</b>
                                <span className='text-muted-foreground text-xs leading-[1.45]'>{f.line}</span>
                            </div>
                            <span
                                className={cn(
                                    'ml-auto shrink-0 self-center font-mono text-[12px] font-semibold whitespace-nowrap',
                                    f.good ? 'text-success' : 'text-[var(--orange-600)]',
                                )}>
                                {f.score}
                                <span className='opacity-55'>/10</span>
                            </span>
                        </div>
                    ))}
                </div>
            }
            fix={AUDIT_FIXES.content}
        />
    )
}

// ── 04 · Topics ─────────────────────────────────────────────────────────────

function TopicsSection({ insights }: { insights: OnboardingInsights }) {
    const topics = insights.currentTopics.length ? insights.currentTopics : []
    if (!topics.length) return null
    const rows = topicStrengths(topics)
    const spread = topics.length > 3

    return (
        <Section
            num='04'
            label='TOPICS'
            head={spread ? `You are spread across ${topics.length} topics.` : 'Your focus is already tight.'}
            copy={
                <>
                    Top performers own 2 or 3. Your wedge is <b className='font-semibold'>{rows[0].topic}</b>.
                    {spread ? ' The rest dilute your signal.' : ' We will keep it that way.'}
                </>
            }
            visual={
                <div className='grid gap-[11px]'>
                    {rows.map((row, i) => (
                        <div key={row.topic} className={cn(i > 1 && 'opacity-50')}>
                            <div className='mb-[5px] flex items-baseline justify-between'>
                                <b className='text-[13px] font-semibold'>{row.topic}</b>
                                <span
                                    className={cn(
                                        'font-mono text-[10px] tracking-[0.04em] uppercase',
                                        i === 0 ? 'text-[var(--orange-600)]' : 'text-muted-foreground',
                                    )}>
                                    {row.tag}
                                </span>
                            </div>
                            <div className='bg-muted h-[7px] overflow-hidden rounded-full'>
                                <span
                                    className='block h-full rounded-full'
                                    style={{
                                        width: `${row.strength}%`,
                                        background:
                                            i === 0
                                                ? 'linear-gradient(90deg, var(--orange-600), var(--orange-400))'
                                                : 'linear-gradient(90deg, var(--petrol-500), var(--petrol-400))',
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            }
            fix={AUDIT_FIXES.topics}
        />
    )
}
