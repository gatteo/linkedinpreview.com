'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRightIcon, CompassIcon, GaugeIcon, PieChartIcon, QuoteIcon } from 'lucide-react'

import type { OnboardingInsights } from '@/types/onboarding'
import {
    CADENCE_BENCHMARK_LINE,
    cadenceOption,
    GOAL_GAP,
    goalRestated,
    INSIGHT_CATEGORY_LABELS,
} from '@/config/onboarding-personalization'
import { EASE_OUT } from '@/lib/motion'
import type { StrategyGoal } from '@/lib/strategy'
import { Button } from '@/components/ui/button'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { firstName, H2, Spinner, Sub, timeAgoLabel } from '../primitives'

// ---------------------------------------------------------------------------
// Insights - the pre-offer payoff: three sequential cards built from the user's
// REAL scraped posts (topic mix -> the gap -> the cadence gap). Every digit
// shown is a deterministic server-computed count or a clearly-framed industry
// benchmark; when the scrape returned nothing, the cards degrade to profile- or
// benchmark-grounded variants and never fabricate a user metric.
// ---------------------------------------------------------------------------

const LOADER_FAILSAFE_MS = 20_000
const DORMANT_AFTER_DAYS = 45

/** No server payload is coming (or it failed): honest benchmark cards from config. */
function localBenchmark(goal: StrategyGoal | undefined): OnboardingInsights {
    // Guarded lookup: the goal comes from persisted storage and may be anything.
    const gap = GOAL_GAP[goal ?? 'revenue-growth'] ?? GOAL_GAP['revenue-growth']
    return {
        kind: 'benchmark',
        observed: { postsAnalyzed: null, postsLast30d: null, postsPerWeek: null, newestPostAt: null, followers: null },
        mix: [],
        dominant: null,
        missing: [gap],
        currentTopics: [],
        adjacentTopics: [],
        voice: { tone: '', excerpt: null },
        headline: `You told us you want to ${goalRestated(goal)}. The content most associated with that is ${INSIGHT_CATEGORY_LABELS[gap.category].toLowerCase()} posts.`,
        generatedAt: '',
    }
}

export function InsightsStep() {
    const { answers, goNext } = useOnboarding()
    const [card, setCard] = React.useState(0)
    const [timedOut, setTimedOut] = React.useState(false)
    // Once the deck is on screen its content is frozen for this mount: a payload
    // that lands late (after the loader failsafe) must not swap cards mid-read.
    const [frozen, setFrozen] = React.useState<OnboardingInsights | null>(null)

    // A payload is still on its way while the scrape is polling or the insights
    // call is in flight; with no URL (richStatus unset/idle) nothing is coming.
    const expecting =
        !answers.insights &&
        answers.insightsStatus !== 'failed' &&
        !!answers.richStatus &&
        answers.richStatus !== 'idle'
    const waiting = expecting && !timedOut && !frozen

    React.useEffect(() => {
        if (!waiting) return
        const t = setTimeout(() => setTimedOut(true), LOADER_FAILSAFE_MS)
        return () => clearTimeout(t)
    }, [waiting])

    React.useEffect(() => {
        if (waiting || frozen) return
        setFrozen(answers.insights ?? localBenchmark(answers.primaryGoal ?? answers.goals[0]))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [waiting, frozen])

    const insights = frozen ?? answers.insights ?? localBenchmark(answers.primaryGoal ?? answers.goals[0])

    React.useEffect(() => {
        if (waiting) return
        track('onb_insights_view', { kind: insights.kind, card, postsAnalyzed: insights.observed.postsAnalyzed })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [card, waiting])

    if (waiting) {
        return (
            <div className='flex flex-col items-center gap-5 py-10 text-center'>
                <Spinner className='size-8' />
                <H2 className='text-xl'>Finishing your profile analysis...</H2>
                <Sub className='max-w-[320px]'>
                    We&apos;re reading your recent posts to see what&apos;s working and what&apos;s missing.
                </Sub>
            </div>
        )
    }

    const cards = [
        <MixCard key='mix' insights={insights} name={answers.profile.name} />,
        <GapCard key='gap' insights={insights} goal={answers.primaryGoal ?? answers.goals[0]} />,
        <CadenceCard key='cadence' insights={insights} targetPerWeek={cadenceOption(answers.cadence).frequency} />,
    ]
    const primaryLabels = ['What am I missing?', 'How do I fix it?', 'Show me my first post']

    const advance = () => {
        if (card < cards.length - 1) setCard(card + 1)
        else goNext()
    }

    return (
        <div className='flex flex-col gap-6'>
            <AnimatePresence mode='wait' initial={false}>
                <motion.div
                    key={card}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}>
                    {cards[card]}
                </motion.div>
            </AnimatePresence>

            <div className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-1.5'>
                    {cards.map((_, i) => (
                        <span
                            key={i}
                            className={`size-1.5 rounded-full transition-colors ${i === card ? 'bg-primary' : 'bg-border'}`}
                        />
                    ))}
                </div>
                <div className='flex items-center gap-2'>
                    {card > 0 && (
                        <Button
                            variant='ghost'
                            size='sm'
                            className='text-muted-foreground'
                            onClick={() => setCard(card - 1)}>
                            Back
                        </Button>
                    )}
                    <Button onClick={advance}>
                        {primaryLabels[card]}
                        <ArrowRightIcon className='size-4' />
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ── Card frame ─────────────────────────────────────────────────────────────

function CardFrame({
    icon: Icon,
    eyebrow,
    children,
}: {
    icon: typeof PieChartIcon
    eyebrow: string
    children: React.ReactNode
}) {
    return (
        <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2.5'>
                <span className='bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-xl'>
                    <Icon className='size-[18px]' />
                </span>
                <span className='text-muted-foreground font-mono text-[11px] font-semibold tracking-[0.12em] uppercase'>
                    {eyebrow}
                </span>
            </div>
            {children}
        </div>
    )
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
    if (!items.length) return null
    return (
        <div className='flex flex-col gap-2'>
            <p className='text-muted-foreground text-xs font-medium'>{label}</p>
            <div className='flex flex-wrap gap-1.5'>
                {items.map((item) => (
                    <span
                        key={item}
                        className='border-border bg-muted/45 text-foreground rounded-full border px-3 py-[5px] text-[12.5px] font-medium'>
                        {item}
                    </span>
                ))}
            </div>
        </div>
    )
}

// ── Card 1: topic mix ──────────────────────────────────────────────────────

function MixCard({ insights, name }: { insights: OnboardingInsights; name?: string }) {
    const fn = firstName(name)
    const { kind, observed, mix, dominant, voice } = insights

    if (kind === 'posts' && dominant) {
        return (
            <CardFrame icon={PieChartIcon} eyebrow={`Your last ${observed.postsAnalyzed} posts, analyzed`}>
                <H2 className='text-[22px]'>
                    {fn ? `${fn}, you` : 'You'} mostly write {INSIGHT_CATEGORY_LABELS[dominant].toLowerCase()} posts.
                </H2>
                <div className='flex flex-col gap-2'>
                    {mix.slice(0, 4).map((slice) => (
                        <div key={slice.category} className='flex items-center gap-3'>
                            <span className='text-foreground w-[132px] shrink-0 text-[12.5px] font-medium'>
                                {INSIGHT_CATEGORY_LABELS[slice.category]}
                            </span>
                            <span className='bg-muted h-2 flex-1 overflow-hidden rounded-full'>
                                <motion.span
                                    className='bg-primary block h-full rounded-full'
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(6, slice.sharePct)}%` }}
                                    transition={{ duration: 0.6, ease: EASE_OUT }}
                                />
                            </span>
                            <span className='text-muted-foreground w-8 shrink-0 text-right text-xs tabular-nums'>
                                {slice.count}
                            </span>
                        </div>
                    ))}
                </div>
                <Sub>
                    That voice is your strength - people follow people, not feeds. Now let&apos;s make it work harder.
                </Sub>
                {voice.excerpt && (
                    <div className='border-primary/20 bg-primary/5 flex items-start gap-2.5 rounded-xl border px-[15px] py-3'>
                        <QuoteIcon className='text-primary/50 mt-0.5 size-4 shrink-0' />
                        <p className='text-foreground text-[13.5px] leading-relaxed'>
                            &quot;{voice.excerpt}&quot;
                            {voice.tone && <span className='text-muted-foreground'> - very {voice.tone}.</span>}
                        </p>
                    </div>
                )}
            </CardFrame>
        )
    }

    if (kind === 'profile') {
        // postsAnalyzed carries the factual basis: 0 = we looked and found none
        // (a real finding), 1-2 = too few to chart, null = the scrape never
        // observed the posts, so no claim about them is allowed.
        const seen = observed.postsAnalyzed
        return (
            <CardFrame icon={PieChartIcon} eyebrow='From your profile'>
                <H2 className='text-[22px]'>Your profile makes a promise. Your posts should prove it.</H2>
                <ChipRow label='What your profile positions you around' items={insights.currentTopics} />
                <Sub>
                    {seen === 0
                        ? "We couldn't find recent posts on your public profile, and that is the real finding: the expertise is there, but nobody scrolling can see it yet."
                        : seen !== null
                          ? `We found only ${seen} recent ${seen === 1 ? 'post' : 'posts'} on your public profile. The expertise is there - it just is not visible often enough yet.`
                          : "We couldn't analyze your recent posts this time, so this reading is based on your profile itself."}
                </Sub>
            </CardFrame>
        )
    }

    return (
        <CardFrame icon={PieChartIcon} eyebrow='Your starting point'>
            <H2 className='text-[22px]'>Let&apos;s build your content engine.</H2>
            <Sub>{insights.headline}</Sub>
            <Sub>
                The people who win on LinkedIn aren&apos;t the loudest - they&apos;re the most consistent, with a
                deliberate mix of content. That&apos;s exactly what we set up next.
            </Sub>
        </CardFrame>
    )
}

// ── Card 2: the gap ─────────────────────────────────────────────────────────

function GapCard({ insights, goal }: { insights: OnboardingInsights; goal?: StrategyGoal }) {
    const missing = insights.missing[0] ?? GOAL_GAP[goal ?? 'revenue-growth'] ?? GOAL_GAP['revenue-growth']
    const label = INSIGHT_CATEGORY_LABELS[missing.category].toLowerCase()
    // Only a real post analysis may claim something is MISSING; the profile and
    // benchmark variants frame the same category as the lever for their goal.
    const headline =
        insights.kind === 'posts'
            ? `You're missing ${label} content.`
            : insights.kind === 'profile'
              ? `Your posts should be showing ${label} content.`
              : `The biggest lever for your goal: ${label} content.`

    return (
        <CardFrame icon={CompassIcon} eyebrow='The gap'>
            <H2 className='text-[22px]'>{headline}</H2>
            <Sub>{missing.why}</Sub>
            <ChipRow label='You already write about' items={insights.currentTopics} />
            {insights.adjacentTopics.length > 0 && (
                <div className='flex flex-col gap-2'>
                    <p className='text-muted-foreground text-xs font-medium'>Worth expanding into</p>
                    <div className='flex flex-col gap-1.5'>
                        {insights.adjacentTopics.slice(0, 3).map((t) => (
                            <div key={t.topic} className='border-border bg-muted/30 rounded-xl border px-[15px] py-2.5'>
                                <span className='text-foreground text-[13.5px] font-semibold'>{t.topic}</span>
                                <span className='text-muted-foreground text-[13px]'> - {t.why}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </CardFrame>
    )
}

// ── Card 3: the cadence gap ─────────────────────────────────────────────────

function isDormant(iso: string): boolean {
    return Date.now() - new Date(iso).getTime() > DORMANT_AFTER_DAYS * 86_400_000
}

function CadenceCard({ insights, targetPerWeek }: { insights: OnboardingInsights; targetPerWeek: number }) {
    const { observed } = insights
    const dormant = observed.newestPostAt ? isDormant(observed.newestPostAt) : false

    let line: React.ReactNode
    if (observed.postsPerWeek !== null && observed.newestPostAt && !dormant) {
        line = (
            <div className='flex items-stretch gap-3'>
                <RhythmStat value={`${observed.postsPerWeek}`} unit='/week' label='you now' />
                <RhythmStat value={`${targetPerWeek}`} unit='/week' label='your plan' highlight />
            </div>
        )
    } else if (dormant && observed.newestPostAt) {
        line = (
            <Sub className='text-foreground text-[15px]'>
                Your most recent post was <span className='font-semibold'>{timeAgoLabel(observed.newestPostAt)}</span>.
                You just committed to {targetPerWeek} a week - the plan is built to make that stick.
            </Sub>
        )
    } else if (observed.postsAnalyzed !== null) {
        line = (
            <Sub className='text-foreground text-[15px]'>
                We found{' '}
                <span className='font-semibold'>
                    {observed.postsAnalyzed} recent {observed.postsAnalyzed === 1 ? 'post' : 'posts'}
                </span>{' '}
                on your public profile. You just committed to {targetPerWeek} a week.
            </Sub>
        )
    } else {
        line = (
            <Sub className='text-foreground text-[15px]'>
                You committed to <span className='font-semibold'>{targetPerWeek} posts a week</span>. Most people
                can&apos;t sustain that manually past week two - your plan is built so you can.
            </Sub>
        )
    }

    return (
        <CardFrame icon={GaugeIcon} eyebrow='Your rhythm'>
            <H2 className='text-[22px]'>Consistency is the whole game.</H2>
            {line}
            <div
                style={{ background: 'color-mix(in oklch, var(--primary) 6%, transparent)' }}
                className='border-primary/20 rounded-xl border px-[15px] py-[13px]'>
                <p className='text-foreground text-sm leading-snug'>{CADENCE_BENCHMARK_LINE}</p>
            </div>
        </CardFrame>
    )
}

function RhythmStat({
    value,
    unit,
    label,
    highlight,
}: {
    value: string
    unit: string
    label: string
    highlight?: boolean
}) {
    return (
        <div
            className={`flex flex-1 flex-col gap-0.5 rounded-xl border px-[15px] py-3 ${
                highlight ? 'border-primary/40 bg-primary/[0.07]' : 'border-border bg-muted/30'
            }`}>
            <span className='font-heading text-foreground text-[26px] leading-tight font-bold tracking-tight'>
                {value}
                <span className='text-muted-foreground text-sm font-normal'>{unit}</span>
            </span>
            <span className='text-muted-foreground text-xs'>{label}</span>
        </div>
    )
}
