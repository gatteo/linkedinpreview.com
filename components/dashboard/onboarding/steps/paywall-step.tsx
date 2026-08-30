'use client'

import * as React from 'react'
import { ArrowLeftIcon, ArrowUpRightIcon, CheckIcon, StarIcon } from 'lucide-react'

import {
    growthCards,
    languageCodePair,
    OB_FEATURES,
    OB_FEATURES_MORE,
    OB_IDEA_PILLARS,
    obGoal,
    obVoice,
    type ObFeature,
} from '@/config/onboarding-flow'
import { rolePlural } from '@/config/onboarding-personalization'
import { PRICING, type CheckoutPlan } from '@/config/pricing'
import { cn } from '@/lib/utils'
import { usePlan } from '@/hooks/use-plan'
import { PostCard } from '@/components/tool/preview/post-card'
import { ScreenSizeProvider } from '@/components/tool/preview/preview-size-context'

import { postTextToDoc, track } from '../ai'
import { GrowthCard, smoothPath } from '../charts'
import { useOnboarding } from '../context'
import { iconFor } from '../icons'
import { CTA, Eyebrow, firstName, GhostLink, H1 } from '../primitives'
import { takeCheckoutPending } from '../types'
import { useScrollGate } from '../use-scroll-gate'
import { OnboardingCheckout } from './checkout'

// ---------------------------------------------------------------------------
// 15 · Paywall - one long, scrollable offer: the ready checklist, modeled
// growth numbers, the pillar posts we actually generated, the feature bento,
// and the pricing block (real PRICING + embedded Stripe checkout). A quiet
// decline path keeps the free plan honest.
// ---------------------------------------------------------------------------

export function PaywallStep() {
    const { answers, finishOffer, role, setUninterruptible } = useOnboarding()
    const { refresh } = usePlan()
    const fn = firstName(answers.profile.name)
    const goal = obGoal(answers.goalId)
    const voice = obVoice(answers.voiceId)
    const frequency = Math.max(1, answers.frequency)
    const wedge = answers.topics[0] || answers.insights?.currentTopics[0] || ''
    const langPair = languageCodePair(answers.identity)

    const [selected, setSelected] = React.useState<CheckoutPlan>('lifetime')
    const [checkout, setCheckout] = React.useState(false)
    const [checkoutError, setCheckoutError] = React.useState(false)

    // The embedded Stripe checkout (cross-origin iframe) has no Radix
    // DismissableLayer of its own, so a stray Escape/outside-click/X while it's
    // open or still creating the session must not close the whole flow
    // mid-payment. `checkoutError` already fell back to a normal in-flow error
    // state, so dismissal is fine again there. Always clears on unmount too.
    const inCheckout = checkout && !checkoutError
    React.useEffect(() => {
        setUninterruptible(inCheckout)
    }, [inCheckout, setUninterruptible])
    React.useEffect(() => {
        return () => setUninterruptible(false)
    }, [setUninterruptible])

    const rootRef = React.useRef<HTMLDivElement>(null)
    // How far the offer is actually read. Without this a user who never scrolls
    // is indistinguishable from one who read the price and declined, which made
    // the largest paywall cohort (viewers who leave with no event at all)
    // impossible to explain. Milestones fire once each, in order.
    const depthRef = React.useRef(0)
    useScrollGate(rootRef, {
        endThreshold: 48,
        onProgress: (p) => {
            const milestone = p >= 1 ? 100 : Math.floor(p * 4) * 25
            if (milestone > depthRef.current) {
                depthRef.current = milestone
                track('onb_paywall_scroll', { depth: milestone })
            }
        },
    })

    React.useEffect(() => {
        track('onb_paywall_view', { ideas: answers.postIdeas?.length ?? 0 })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Hosted-checkout return: Stripe redirected back here with the outcome in
    // the query params (the embedded flow uses onComplete instead).
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const status = params.get('checkout')
        const pending = takeCheckoutPending()
        if (!status || params.get('source') !== 'onboarding') {
            // Back out of Stripe rather than through its success/cancel links and
            // there is no status to read - the marker is the only evidence the
            // round-trip happened at all.
            if (pending) track('onb_checkout_abandoned', { plan: pending.plan, via: 'no_return_param' })
            return
        }
        const plan: CheckoutPlan = params.get('plan') === 'monthly' ? 'monthly' : 'lifetime'
        params.delete('checkout')
        params.delete('plan')
        params.delete('source')
        params.delete('session_id')
        const qs = params.toString()
        window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
        if (status === 'success') {
            track('onb_purchase_success', { plan })
            refresh()
            finishOffer(true)
        } else {
            track('onb_checkout_abandoned', { plan, via: 'cancel_url' })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const startCheckout = () => {
        track('onb_offer_select', { plan: selected })
        setCheckoutError(false)
        setCheckout(true)
    }

    const onPurchased = () => {
        track('onb_purchase_success', { plan: selected })
        refresh()
        finishOffer(true)
    }

    const decline = () => {
        track('onb_offer_decline')
        finishOffer(false)
    }

    if (inCheckout) {
        return (
            <div className='flex flex-col gap-4'>
                <button
                    type='button'
                    onClick={() => setCheckout(false)}
                    className='text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 self-start text-sm'>
                    <ArrowLeftIcon className='size-4' />
                    Back to your plan
                </button>
                <OnboardingCheckout
                    plan={selected}
                    source='onboarding'
                    onComplete={onPurchased}
                    onError={() => setCheckoutError(true)}
                />
                <GhostLink onClick={decline} className='mx-auto text-xs'>
                    Continue on the free plan
                </GhostLink>
            </div>
        )
    }

    const checklist: React.ReactNode[] = [
        <>
            <b>90-day content calendar</b>, {frequency}×/week, around {wedge ? <b>{wedge}</b> : 'your strongest angle'}
        </>,
        <>
            <b>Posts drafted in your {voice.title.toLowerCase()} voice</b>, never a blank page
        </>,
        ...(langPair
            ? [
                  <>
                      <b>Auto {langPair} optimization</b> - write once, reach both your audiences
                  </>,
              ]
            : []),
        <>
            <b>Live analytics + best-time-to-post</b>, tuned to your audience
        </>,
        <>
            <b>One-click rewrites</b> on anything you draft
        </>,
    ]

    return (
        <div ref={rootRef} className='flex flex-col'>
            {/* hero + ready checklist */}
            <Eyebrow>Everything&rsquo;s ready</Eyebrow>
            <H1>{fn ? `Your 90-day plan is built, ${fn}.` : 'Your 90-day plan is built.'}</H1>
            <div className='mt-4 grid gap-3'>
                {checklist.map((item, i) => (
                    <div
                        key={i}
                        className='text-card-foreground flex items-start gap-[11px] text-sm leading-[1.4] [&_b]:font-semibold [&_b]:text-[var(--foreground)]'>
                        <span className='text-primary mt-px flex shrink-0'>
                            <CheckIcon className='size-[15px]' strokeWidth={2.5} />
                        </span>
                        <span>{item}</span>
                    </div>
                ))}
            </div>

            {/* growth numbers */}
            <PwSection
                title='Your numbers, 90 days from now'
                sub={`Modeled on ${rolePlural(role).toLowerCase()}${answers.niche ? ` in ${answers.niche}` : ''} who post ${frequency}×/week with a system.`}>
                <div className='grid grid-cols-2 gap-3 max-sm:grid-cols-1'>
                    {growthCards(answers.richSummary, frequency, answers.goalId).map((card, i) => (
                        <GrowthCard key={card.label} card={card} idx={i} />
                    ))}
                </div>
            </PwSection>

            {/* pillar posts - real generated drafts, or nothing */}
            {!!answers.postIdeas?.length && (
                <PwSection
                    title='Posts, already written in your voice'
                    sub='Your plan comes preloaded with draft ideas in your voice across every content pillar.'>
                    <div className='-mx-0.5 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-0.5 pb-3 [scrollbar-width:thin]'>
                        {answers.postIdeas.map((idea) => {
                            const pillar =
                                OB_IDEA_PILLARS.find((p) => p.category === idea.category) ?? OB_IDEA_PILLARS[0]
                            return (
                                <div
                                    key={idea.category}
                                    className='border-border w-[300px] shrink-0 snap-start overflow-hidden rounded-[14px] border bg-white shadow-[var(--card-shadow)]'>
                                    <div
                                        className='flex items-center justify-between gap-2 px-3.5 py-2 text-white'
                                        style={{ background: pillar.color }}>
                                        <span className='font-mono text-[10px] font-bold tracking-[0.14em]'>
                                            {pillar.tag}
                                        </span>
                                        <span className='text-[11px] font-semibold opacity-90'>{pillar.label}</span>
                                    </div>
                                    <ScreenSizeProvider initialSize='mobile'>
                                        <PostCard
                                            content={postTextToDoc(idea.text)}
                                            media={null}
                                            author={{
                                                name: answers.profile.name,
                                                headline: answers.profile.headline,
                                                avatarUrl: answers.profile.avatarUrl,
                                            }}
                                            interactiveMore={false}
                                            className='rounded-none border-none shadow-none'
                                        />
                                    </ScreenSizeProvider>
                                </div>
                            )
                        })}
                    </div>
                    <p className='text-muted-foreground mt-1 text-xs leading-relaxed'>
                        These drafts are idea starters generated from your profile, not finished posts - you will shape
                        and polish them in the editor before anything goes live.
                    </p>
                </PwSection>
            )}

            {/* features */}
            <PwSection
                title='All the tools you get'
                sub='Everything you need to go from a blank page to a published post'>
                <div className='grid grid-cols-2 gap-3 max-sm:grid-cols-1'>
                    {OB_FEATURES.map((f) => (
                        <FeatureHighlight key={f.title} feature={f} />
                    ))}
                </div>
                <div className='mt-3 grid grid-cols-2 gap-[9px] max-sm:grid-cols-1'>
                    {OB_FEATURES_MORE.map((f) => {
                        const Icon = iconFor(f.icon)
                        return (
                            <div
                                key={f.title}
                                className='bg-secondary border-border flex items-start gap-2.5 rounded-[11px] border px-3 py-[11px]'>
                                <span className='text-primary mt-px flex shrink-0'>
                                    <Icon className='size-4' />
                                </span>
                                <div>
                                    <b className='block text-[12.5px] font-semibold'>{f.title}</b>
                                    <span className='text-muted-foreground block text-[11px] leading-[1.4]'>
                                        {f.desc}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <p className='text-muted-foreground mt-3.5 text-center font-mono text-[11px] tracking-[0.06em] uppercase'>
                    &hellip; and much more
                </p>
            </PwSection>

            {/* pricing */}
            <PwSection>
                <Eyebrow className='text-center'>Claim your plan</Eyebrow>
                <h2 className='font-heading mb-1 text-center text-lg font-semibold tracking-[-0.01em]'>
                    {goal.priceLine}
                </h2>
                {checkoutError && (
                    <p className='border-border bg-muted/40 text-muted-foreground mt-3 rounded-lg border px-3 py-2 text-center text-xs'>
                        Checkout is not available right now. You can continue on the free plan and upgrade later.
                    </p>
                )}
                <LifetimeCard selected={selected === 'lifetime'} onSelect={() => setSelected('lifetime')} />
                <div className='text-muted-foreground my-4 flex items-center gap-3 font-mono text-[11px] tracking-[0.08em] uppercase before:h-px before:flex-1 before:bg-[var(--border)] after:h-px after:flex-1 after:bg-[var(--border)]'>
                    or
                </div>
                <button
                    type='button'
                    onClick={() => setSelected('monthly')}
                    className={cn(
                        'flex w-full cursor-pointer items-center gap-3.5 rounded-[13px] border px-4 py-[15px] text-left transition-colors',
                        selected === 'monthly'
                            ? 'border-primary bg-[color-mix(in_oklch,var(--primary)_7%,var(--card))] shadow-[0_0_0_1px_var(--primary)]'
                            : 'bg-secondary border-border hover:border-primary/50',
                    )}>
                    <span
                        className={cn(
                            'relative size-5 shrink-0 rounded-full border-2',
                            selected === 'monthly'
                                ? 'border-primary after:bg-primary after:absolute after:inset-[3px] after:rounded-full'
                                : 'border-border-strong',
                        )}
                    />
                    <span className='min-w-0'>
                        <b className='font-heading text-[15px] font-semibold'>Monthly</b>
                        <span className='text-muted-foreground mt-0.5 block text-xs'>
                            Billed monthly. Cancel anytime.
                        </span>
                    </span>
                    <span className='ml-auto shrink-0 text-right'>
                        <span className='font-heading text-[19px] font-bold'>{PRICING.monthly.display}</span>
                        <span className='text-muted-foreground ml-[3px] text-xs'>/mo</span>
                    </span>
                </button>

                <div className='mt-3 text-center'>
                    <GhostLink onClick={decline} className='text-xs'>
                        Continue on the free plan
                    </GhostLink>
                </div>
            </PwSection>

            {/* Purchase CTA full-bleeds past the wrapper padding so the fade spans the whole column. */}
            <div
                className='sticky bottom-0 z-10 -mx-[clamp(20px,4vw,40px)] mt-2 flex flex-col items-center gap-2 px-[clamp(20px,4vw,40px)] pt-10 pb-1'
                style={{ background: 'linear-gradient(to bottom, transparent, var(--card) 42%)' }}>
                <CTA onClick={startCheckout}>{selected === 'lifetime' ? 'Get lifetime' : 'Start monthly'}</CTA>
            </div>
        </div>
    )
}

// ── Section frame ───────────────────────────────────────────────────────────

function PwSection({
    title,
    sub,
    center,
    children,
}: {
    title?: string
    sub?: string
    center?: boolean
    children: React.ReactNode
}) {
    return (
        <div className={cn('border-border mt-5 border-t py-5', center && 'text-center')}>
            {title && <h2 className='font-heading mb-1 text-lg font-semibold tracking-[-0.01em]'>{title}</h2>}
            {sub && <p className='text-muted-foreground mb-3.5 text-[12.5px] leading-normal'>{sub}</p>}
            {children}
        </div>
    )
}

// ── Feature illustrations (code-built, Typefully-style) ─────────────────────

function FeatureHighlight({ feature }: { feature: ObFeature }) {
    const Art = feature.art ? FEAT_ART[feature.art] : null
    return (
        <div className='bg-card border-border rounded-[14px] border p-3 shadow-[var(--card-shadow)]'>
            {Art && <Art />}
            <div className='px-1 pt-3 pb-0.5'>
                <b className='mb-[3px] block text-sm font-semibold tracking-[-0.01em]'>{feature.title}</b>
                <span className='text-muted-foreground block text-xs leading-[1.45]'>{feature.desc}</span>
            </div>
        </div>
    )
}

function ArtFrame({ children }: { children: React.ReactNode }) {
    return (
        <div
            className='border-border relative h-[108px] overflow-hidden rounded-[10px] border p-3'
            style={{
                background:
                    'linear-gradient(158deg, color-mix(in oklch, var(--petrol-500) 7%, var(--card)), var(--secondary))',
            }}>
            {children}
        </div>
    )
}

function ArtAI() {
    return (
        <ArtFrame>
            <div className='border-border flex h-full flex-col gap-2 rounded-lg border bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'>
                <span className='h-[7px] w-[72%] rounded-full bg-[color-mix(in_oklch,var(--petrol-500)_16%,#fff)]' />
                <span className='h-[7px] w-[92%] rounded-full bg-[color-mix(in_oklch,var(--petrol-500)_16%,#fff)]' />
                <span className='h-[7px] w-[84%] rounded-full bg-[color-mix(in_oklch,var(--petrol-500)_16%,#fff)]' />
                <span className='relative h-[7px] w-[48%] rounded-full bg-[color-mix(in_oklch,var(--orange-500)_24%,#fff)]'>
                    <i className='animate-ob-blink absolute -top-[3px] -right-[5px] h-[13px] w-[2px] bg-[var(--orange-500)]' />
                </span>
            </div>
            <span className='absolute right-3.5 bottom-[13px] inline-flex items-center gap-[5px] rounded-full bg-[var(--orange-500)] px-[9px] py-1 text-[10px] font-semibold text-white shadow-[0_3px_8px_color-mix(in_oklch,var(--orange-500)_40%,transparent)]'>
                In your voice
            </span>
        </ArtFrame>
    )
}

function ArtPreview() {
    return (
        <ArtFrame>
            <div className='flex h-full flex-col gap-[7px] rounded-lg bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_0_2px_color-mix(in_oklch,var(--orange-500)_20%,transparent)]'>
                <div className='flex items-center gap-2'>
                    <span className="relative size-[22px] shrink-0 rounded-full bg-[linear-gradient(135deg,var(--petrol-700),var(--petrol-500))] after:absolute after:-right-0.5 after:-bottom-0.5 after:size-[9px] after:rounded-full after:border-[1.5px] after:border-white after:bg-[var(--info)] after:content-['']" />
                    <div className='flex flex-1 flex-col gap-1'>
                        <i className='block h-[5px] w-[54%] rounded-full bg-[color-mix(in_oklch,var(--petrol-500)_20%,#fff)]' />
                        <i className='block h-[5px] w-[34%] rounded-full bg-[color-mix(in_oklch,var(--petrol-500)_20%,#fff)]' />
                    </div>
                </div>
                <div className='flex flex-col gap-[5px]'>
                    <i className='bg-secondary block h-1.5 w-[94%] rounded-full' />
                    <i className='bg-secondary block h-1.5 w-[82%] rounded-full' />
                    <i className='bg-secondary block h-1.5 w-[58%] rounded-full' />
                </div>
                <div className='border-border mt-auto flex justify-between border-t pt-1.5'>
                    {[0, 1, 2, 3].map((i) => (
                        <b
                            key={i}
                            className='block h-1.5 w-4 rounded-full bg-[color-mix(in_oklch,var(--petrol-500)_16%,#fff)]'
                        />
                    ))}
                </div>
            </div>
        </ArtFrame>
    )
}

function ArtCalendar() {
    const chips = [
        { c: 1, r: 1, k: 'var(--petrol-500)' },
        { c: 1, r: 3, k: 'var(--orange-500)' },
        { c: 2, r: 2, k: 'var(--green)' },
        { c: 3, r: 1, k: 'var(--orange-500)' },
        { c: 3, r: 2, k: 'var(--petrol-500)' },
        { c: 4, r: 3, k: 'var(--green)' },
    ]
    return (
        <ArtFrame>
            <div className='flex h-full flex-col gap-[7px]'>
                <div className='text-muted-foreground grid grid-cols-4 gap-1.5 font-mono text-[8.5px] tracking-[0.06em] uppercase'>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                </div>
                <div className='grid flex-1 auto-rows-fr grid-cols-4 gap-1.5'>
                    {chips.map((x, i) => (
                        <span
                            key={i}
                            className='rounded-[5px] border border-l-[3px]'
                            style={{
                                gridColumn: x.c,
                                gridRow: x.r,
                                background: `color-mix(in oklch, ${x.k} 16%, #fff)`,
                                borderColor: `color-mix(in oklch, ${x.k} 38%, transparent)`,
                                borderLeftColor: x.k,
                            }}
                        />
                    ))}
                </div>
            </div>
        </ArtFrame>
    )
}

function ArtAnalytics() {
    const W = 168
    const H = 62
    const shape = [0.16, 0.24, 0.19, 0.36, 0.44, 0.4, 0.58, 0.74, 1]
    const pts: [number, number][] = shape.map((v, i) => [(i / (shape.length - 1)) * W, H - 3 - v * (H - 10)])
    const line = smoothPath(pts)
    const area = `${line} L ${W} ${H} L 0 ${H} Z`
    const end = pts[pts.length - 1]
    return (
        <ArtFrame>
            <div className='flex h-full flex-col'>
                <div className='flex items-baseline justify-between'>
                    <span className='font-heading text-success inline-flex items-center gap-[3px] text-lg font-bold tracking-[-0.01em]'>
                        <ArrowUpRightIcon className='size-[11px]' /> 184%
                    </span>
                    <span className='text-muted-foreground font-mono text-[9px] tracking-[0.05em] uppercase'>
                        last 30 days
                    </span>
                </div>
                <svg
                    className='mt-1 block w-full flex-1 overflow-visible'
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio='none'>
                    <defs>
                        <linearGradient id='ob-fx-ag' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='0%' stopColor='color-mix(in oklch, var(--green) 30%, transparent)' />
                            <stop offset='100%' stopColor='transparent' />
                        </linearGradient>
                    </defs>
                    <path d={area} fill='url(#ob-fx-ag)' />
                    <path
                        d={line}
                        fill='none'
                        stroke='var(--green)'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        vectorEffect='non-scaling-stroke'
                    />
                    <circle cx={end[0]} cy={end[1]} r='3' fill='var(--green)' />
                </svg>
            </div>
        </ArtFrame>
    )
}

const FEAT_ART: Record<NonNullable<ObFeature['art']>, React.ComponentType> = {
    ai: ArtAI,
    preview: ArtPreview,
    calendar: ArtCalendar,
    analytics: ArtAnalytics,
}

// ── Lifetime plan card ──────────────────────────────────────────────────────

function LifetimeCard({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
    return (
        <button
            type='button'
            onClick={onSelect}
            className={cn(
                'relative mt-4 block w-full cursor-pointer overflow-hidden rounded-[18px] text-left text-[oklch(0.32_0.045_88)]',
                'border border-[oklch(0.80_0.075_90)] shadow-[0_14px_34px_-12px_oklch(0.72_0.085_88/0.75),inset_0_1px_0_oklch(1_0_0/0.6)]',
                selected && 'ring-primary ring-2 ring-offset-2 ring-offset-[var(--card)]',
            )}
            style={{
                background:
                    'linear-gradient(135deg, oklch(0.94 0.055 96), oklch(0.87 0.09 90) 46%, oklch(0.81 0.10 87))',
            }}>
            <span
                className='animate-ob-shine pointer-events-none absolute top-0 bottom-0 left-[-40%] z-[1] w-[40%]'
                style={{ background: 'linear-gradient(105deg, transparent, oklch(1 0 0 / 0.5), transparent)' }}
            />
            <div className='relative z-[2] px-5 pt-[18px] pb-4'>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.34_0.045_82)] px-[11px] py-[5px] font-mono text-[10.5px] font-bold tracking-[0.08em] text-[oklch(0.94_0.075_92)] uppercase'>
                    <StarIcon className='size-3 fill-current' strokeWidth={0} />
                    Lifetime
                </span>
                <div className='mt-3.5 mb-1 flex items-baseline gap-2'>
                    <span className='font-heading text-[40px] leading-none font-extrabold tracking-[-0.02em]'>
                        {PRICING.lifetime.display}
                    </span>
                    <span className='text-[13px] font-semibold opacity-70'>once</span>
                </div>
                <p className='max-w-[90%] text-[12.5px] leading-[1.45] opacity-80'>
                    Pay once, keep it forever. Every future feature included - no renewals, ever.
                </p>
            </div>
        </button>
    )
}
