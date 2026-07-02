'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PencilIcon, TriangleAlertIcon } from 'lucide-react'

import { TONE_OPTIONS, type Tone } from '@/config/ai'
import {
    getRoleContent,
    NICHE_OPTIONS,
    resolveRole,
    ROLE_LABELS,
    toneFromSummary,
    type Role,
} from '@/config/onboarding-personalization'
import { EASE_OUT, fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { STRATEGY_AUDIENCES, STRATEGY_GOALS, type StrategyAudience, type StrategyGoal } from '@/lib/strategy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { enrichProfile, track } from '../ai'
import { useOnboarding } from '../context'
import { iconFor } from '../icons'
import { FieldLabel, H2, Pill, Spinner, Sub } from '../primitives'

const ROLES = Object.keys(ROLE_LABELS) as Role[]

const CONFIDENCE_FLOOR = 0.35
const MAX_AUDIENCE = 3

// Shown only when we are genuinely fetching a pasted profile URL.
const READING_LINES_URL = ['Reading your recent posts', 'Spotting your niche', 'Matching your voice']
// Shown for a connected-but-no-URL account (name + goal only - a starting guess).
const READING_LINES_BASIC = ['Reviewing your goal', 'Spotting your niche', 'Shaping your voice']

type Field = 'role' | 'niche' | 'audience' | 'goal' | 'tone' | null

const audienceLabel = (value: StrategyAudience | undefined): string =>
    STRATEGY_AUDIENCES.find((a) => a.value === value)?.label ?? 'your audience'
const toneLabel = (value: Tone): string => TONE_OPTIONS.find((t) => t.value === value)?.label ?? 'Professional'
const goalLabel = (value: StrategyGoal | undefined): string =>
    STRATEGY_GOALS.find((g) => g.value === value)?.label ?? ''

export function MirrorStep() {
    const { answers, update, goNext, goBack } = useOnboarding()
    // We only have something real to read when a profile URL was pasted (we fetch
    // it) or LinkedIn is connected (name + photo). With neither, this is the
    // manual path - skip the "reading" theater entirely (see Bug A).
    const hasUrl = !!answers.profileUrl
    const hasSignal = hasUrl || answers.linkedinConnected
    const [phase, setPhase] = React.useState<'reading' | 'ready'>(
        answers.enrichConfidence !== undefined || !hasSignal ? 'ready' : 'reading',
    )
    const [editing, setEditing] = React.useState<Field>(null)
    // Sticky in answers (not local state) so a remount / Back-nav after the user
    // already chose to enter details by hand doesn't re-show the error over their
    // finished form - the same remount-persistence trap the welcome step hit.
    const manualOverride = answers.mirrorManual ?? false
    // Both refs survive a StrictMode setup/cleanup/setup cycle: startedRef keeps
    // the enrich call from firing twice, settledRef keeps us committing once.
    const startedRef = React.useRef(false)
    const settledRef = React.useRef(false)

    React.useEffect(() => {
        // Already enriched (e.g. a refresh-resume): nothing to do.
        if (answers.enrichConfidence !== undefined) return

        // Manual path: nothing to read. Mark low confidence so the render shows
        // the manual form, with no fake animation and no wasted AI call.
        if (!hasSignal) {
            if (!settledRef.current) {
                settledRef.current = true
                update({ enrichConfidence: 0 })
            }
            return
        }

        // Commit the enrichment exactly once - whether it resolves, returns null,
        // or the failsafe fires. Unlike a per-mount "cancelled" flag, settledRef +
        // a per-mount failsafe survive a StrictMode remount, so the user is never
        // stranded on the reading screen (mirror's version of the building hang).
        const finish = (result: Awaited<ReturnType<typeof enrichProfile>>) => {
            if (settledRef.current) return
            settledRef.current = true
            clearTimeout(failsafe)
            const role = resolveRole(result?.role)
            const primaryAudience = result?.primaryAudience
            const nextAudience =
                primaryAudience && !answers.audience.includes(primaryAudience)
                    ? [primaryAudience, ...answers.audience].slice(0, MAX_AUDIENCE)
                    : answers.audience
            const fetchedProfile = result?.profile
            update({
                role,
                niche: result?.niche || answers.niche || '',
                audience: nextAudience,
                toneSummary: result?.toneSummary || answers.toneSummary || '',
                tone: answers.tone ?? toneFromSummary(result?.toneSummary),
                opportunityLine: result?.opportunityLine || getRoleContent(role).mirrorOpportunity,
                enrichConfidence: result?.confidence ?? 0,
                // Fill empty identity fields from the real fetched profile.
                profile: fetchedProfile
                    ? {
                          name: answers.profile.name || fetchedProfile.name,
                          headline: answers.profile.headline || fetchedProfile.headline,
                          avatarUrl: answers.profile.avatarUrl || fetchedProfile.avatarUrl,
                      }
                    : answers.profile,
            })
            setPhase('ready')
        }

        // Failsafe: sits just past the client enrich timeout (22s) so a real
        // result is always preferred; only a call that never settles hits this.
        // Re-armed every mount so a StrictMode remount can't leave us without one.
        const failsafe = setTimeout(() => finish(null), 24000)

        // Fire the enrich + minimum-theater wait exactly once across remounts.
        if (!startedRef.current) {
            startedRef.current = true
            track('onb_mirror_view')
            const minTheater = new Promise((r) => setTimeout(r, 2000))
            Promise.all([
                enrichProfile({
                    name: answers.profile.name || undefined,
                    headline: answers.profile.headline || undefined,
                    profileUrl: answers.profileUrl || undefined,
                    welcomeGoal: answers.primaryGoal,
                }),
                minTheater,
            ]).then(([result]) => finish(result))
        }

        return () => clearTimeout(failsafe)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (phase === 'reading') {
        const lines = hasUrl ? READING_LINES_URL : READING_LINES_BASIC
        return (
            <div className='flex flex-col items-center gap-6 py-6'>
                <Spinner className='size-8' />
                <H2 className='text-xl'>{hasUrl ? 'Reading your profile...' : 'Setting things up...'}</H2>
                <ul className='flex w-full max-w-[250px] flex-col gap-2.5'>
                    {lines.map((line, i) => (
                        <ReadingLine key={line} label={line} delay={0.4 + i * 0.6} />
                    ))}
                </ul>
            </div>
        )
    }

    const role = resolveRole(answers.role)
    const lowConfidence = (answers.enrichConfidence ?? 0) < CONFIDENCE_FLOOR
    const tone: Tone = answers.tone ?? toneFromSummary(answers.toneSummary)
    const goal = answers.primaryGoal ?? answers.goals[0]
    const opportunity = answers.opportunityLine || getRoleContent(role).mirrorOpportunity

    const editChip = (field: Exclude<Field, null>) => {
        setEditing((cur) => (cur === field ? null : field))
        track('onb_mirror_edit', { field })
    }

    const setPrimaryAudience = (value: StrategyAudience) =>
        update({ audience: [value, ...answers.audience.filter((a) => a !== value)].slice(0, MAX_AUDIENCE) })

    // A pasted profile URL that we couldn't read (LinkedIn blocks datacenter IPs
    // when no scrape API is configured). Own the failure with an explicit error +
    // a manual fallback, instead of silently dropping onto the "tell us" form.
    if (hasUrl && lowConfidence && !manualOverride) {
        return (
            <div className='flex flex-col items-center gap-5 py-4 text-center'>
                <div className='bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-2xl'>
                    <TriangleAlertIcon className='size-7' />
                </div>
                <div className='flex flex-col gap-1.5'>
                    <H2 className='text-xl'>We couldn&apos;t read that profile</H2>
                    <Sub>
                        LinkedIn blocked the request, so we couldn&apos;t pull your details automatically. You can add
                        them yourself in a few taps.
                    </Sub>
                </div>
                <div className='flex w-full max-w-[320px] flex-col gap-2.5'>
                    <Button
                        onClick={() => {
                            track('onb_mirror_fetch_failed', { action: 'manual' })
                            update({ mirrorManual: true })
                        }}
                        className='w-full'>
                        Continue manually
                    </Button>
                    <Button variant='ghost' onClick={goBack} className='text-muted-foreground w-full'>
                        Try a different URL
                    </Button>
                </div>
            </div>
        )
    }

    // ── Manual path: nothing enriched - collect what the welcome step didn't. ──
    if (lowConfidence) {
        const needGoal = !goal
        const needAudience = answers.audience.length === 0
        const name = answers.profile.name ?? ''
        const niche = answers.niche ?? ''
        const toggleAudience = (value: StrategyAudience) => {
            const has = answers.audience.includes(value)
            const next = has ? answers.audience.filter((a) => a !== value) : [...answers.audience, value]
            update({ audience: next.slice(0, MAX_AUDIENCE) })
        }
        // Voice + "anything we should avoid" live on the dedicated Voice step, so
        // this form stays focused on identity. Everything shown here is required.
        const canContinue =
            !!name.trim() &&
            !!answers.role &&
            !!niche.trim() &&
            (!needGoal || !!goal) &&
            (!needAudience || answers.audience.length > 0)

        return (
            <motion.div
                variants={staggerContainer}
                initial='hidden'
                animate='visible'
                className='flex flex-col gap-[22px]'>
                <motion.div variants={staggerItem}>
                    <H2 className='text-xl'>Tell us about you</H2>
                    <Sub className='mt-1'>So everything we build sounds right for you.</Sub>
                </motion.div>
                <motion.div variants={staggerItem} className='flex flex-col gap-1.5'>
                    <FieldLabel>How should we call you?</FieldLabel>
                    <Input
                        value={name}
                        onChange={(e) => update({ profile: { ...answers.profile, name: e.target.value } })}
                        placeholder='e.g. Alex Rivera'
                        autoComplete='name'
                        aria-label='How should we call you?'
                    />
                </motion.div>
                <motion.div variants={staggerItem} className='flex flex-col gap-2'>
                    <FieldLabel>You are a...</FieldLabel>
                    <div className='flex flex-wrap gap-2'>
                        {ROLES.map((r) => (
                            <Pill key={r} selected={answers.role === r} onClick={() => update({ role: r })}>
                                {ROLE_LABELS[r]}
                            </Pill>
                        ))}
                    </div>
                </motion.div>
                <motion.div variants={staggerItem} className='flex flex-col gap-1.5'>
                    <FieldLabel>Your niche</FieldLabel>
                    <Select value={niche || undefined} onValueChange={(v) => update({ niche: v })}>
                        <SelectTrigger className='w-full' aria-label='Your niche'>
                            <SelectValue placeholder='Choose your niche' />
                        </SelectTrigger>
                        <SelectContent>
                            {NICHE_OPTIONS.map((n) => (
                                <SelectItem key={n} value={n}>
                                    {n}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </motion.div>
                {needGoal && (
                    <motion.div variants={staggerItem} className='flex flex-col gap-2'>
                        <FieldLabel>What does winning look like?</FieldLabel>
                        <div className='flex flex-wrap gap-2'>
                            {STRATEGY_GOALS.map((g) => (
                                <Pill
                                    key={g.value}
                                    icon={iconFor(g.icon)}
                                    selected={goal === g.value}
                                    onClick={() => update({ primaryGoal: g.value, goals: [g.value] })}>
                                    {g.label}
                                </Pill>
                            ))}
                        </div>
                    </motion.div>
                )}
                {needAudience && (
                    <motion.div variants={staggerItem} className='flex flex-col gap-2'>
                        <FieldLabel>
                            Who are you writing for?{' '}
                            <span className='text-muted-foreground font-normal'>(up to 3)</span>
                        </FieldLabel>
                        <div className='flex flex-wrap gap-2'>
                            {STRATEGY_AUDIENCES.map((a) => {
                                const selected = answers.audience.includes(a.value)
                                const disabled = !selected && answers.audience.length >= MAX_AUDIENCE
                                return (
                                    <Pill
                                        key={a.value}
                                        icon={iconFor(a.icon)}
                                        selected={selected}
                                        disabled={disabled}
                                        onClick={() => toggleAudience(a.value)}>
                                        {a.label}
                                    </Pill>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
                <motion.div variants={staggerItem}>
                    <Button onClick={goNext} disabled={!canContinue} className='w-full'>
                        Continue
                    </Button>
                </motion.div>
            </motion.div>
        )
    }

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-[18px]'>
            <motion.div variants={fadeUp}>
                <p className='text-muted-foreground mb-1.5 text-[13.5px]'>Here&apos;s where we&apos;d start</p>
                <p className='text-foreground text-[17px] leading-[1.7] text-pretty'>
                    You&apos;re a <Chip onClick={() => editChip('role')}>{ROLE_LABELS[role]}</Chip>
                    {answers.niche ? (
                        <>
                            {' '}
                            in <Chip onClick={() => editChip('niche')}>{answers.niche}</Chip>
                        </>
                    ) : (
                        <>
                            {' '}
                            <Chip onClick={() => editChip('niche')}>add your niche</Chip>
                        </>
                    )}
                    , writing mostly for{' '}
                    <Chip onClick={() => editChip('audience')}>{audienceLabel(answers.audience[0])}</Chip>
                    {goal ? (
                        <>
                            , mainly to <Chip onClick={() => editChip('goal')}>{goalLabel(goal).toLowerCase()}</Chip>
                        </>
                    ) : (
                        <>
                            {' '}
                            <Chip onClick={() => editChip('goal')}>add your goal</Chip>
                        </>
                    )}
                    , in a <Chip onClick={() => editChip('tone')}>{toneLabel(tone)}</Chip> voice.
                </p>
            </motion.div>

            <motion.div
                variants={staggerItem}
                style={{ background: 'color-mix(in oklch, var(--primary) 6%, transparent)' }}
                className='border-primary/20 rounded-xl border px-[15px] py-[13px]'>
                <p className='text-foreground text-sm leading-snug'>
                    <span className='font-semibold'>Your biggest opportunity:</span> {opportunity}
                </p>
            </motion.div>

            <AnimatePresence initial={false}>
                {editing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: EASE_OUT }}
                        className='overflow-hidden'>
                        <div className='border-border bg-muted/30 flex flex-wrap gap-2 rounded-xl border p-3.5'>
                            {editing === 'role' &&
                                ROLES.map((r) => (
                                    <Pill key={r} selected={role === r} onClick={() => update({ role: r })}>
                                        {ROLE_LABELS[r]}
                                    </Pill>
                                ))}
                            {editing === 'niche' && (
                                <Input
                                    value={answers.niche ?? ''}
                                    onChange={(e) => update({ niche: e.target.value })}
                                    placeholder='e.g. B2B SaaS growth'
                                    autoFocus
                                />
                            )}
                            {editing === 'audience' &&
                                STRATEGY_AUDIENCES.map((a) => (
                                    <Pill
                                        key={a.value}
                                        selected={answers.audience[0] === a.value}
                                        onClick={() => setPrimaryAudience(a.value)}>
                                        {a.label}
                                    </Pill>
                                ))}
                            {editing === 'goal' &&
                                STRATEGY_GOALS.map((g) => (
                                    <Pill
                                        key={g.value}
                                        selected={goal === g.value}
                                        onClick={() => update({ primaryGoal: g.value, goals: [g.value] })}>
                                        {g.label}
                                    </Pill>
                                ))}
                            {editing === 'tone' &&
                                TONE_OPTIONS.map((o) => (
                                    <Pill
                                        key={o.value}
                                        selected={tone === o.value}
                                        onClick={() => update({ tone: o.value })}>
                                        {o.label}
                                    </Pill>
                                ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                <PencilIcon className='size-3' />
                Tap anything to adjust
            </p>
            <motion.div variants={staggerItem}>
                <Button onClick={goNext} className='w-full'>
                    Looks right, continue
                </Button>
            </motion.div>
        </motion.div>
    )
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type='button'
            onClick={onClick}
            className='border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 mx-0.5 inline-flex rounded-[7px] border px-[7px] py-px align-baseline text-[17px] font-semibold transition-colors'>
            {children}
        </button>
    )
}

// An in-progress line. It deliberately never ticks a completion checkmark: the
// fetch may return nothing (LinkedIn blocks datacenter IPs), so we only ever
// show that we are *trying* - never assert that a step finished. On success we
// transition to the mirror; on failure, to the manual form.
function ReadingLine({ label, delay }: { label: string; delay: number }) {
    const [active, setActive] = React.useState(false)
    React.useEffect(() => {
        const t = setTimeout(() => setActive(true), delay * 1000)
        return () => clearTimeout(t)
    }, [delay])
    return (
        <li
            className={`flex items-center gap-3 text-sm transition-colors ${
                active ? 'text-foreground' : 'text-muted-foreground/45'
            }`}>
            <span className='flex size-5 shrink-0 items-center justify-center'>
                <Spinner className='size-4' />
            </span>
            {label}
        </li>
    )
}
