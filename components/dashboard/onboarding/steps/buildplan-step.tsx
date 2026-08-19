'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { BUILDPLAN_TASKS, COMMITMENT_OPTIONS, OB_IDEA_PILLARS, type Commitment } from '@/config/onboarding-flow'
import { ROLE_LABELS } from '@/config/onboarding-personalization'
import { EASE_OUT } from '@/lib/motion'
import { cn } from '@/lib/utils'

import { generatePostIdeas, track } from '../ai'
import { useOnboarding } from '../context'
import { firstName, LoaderBlock } from '../primitives'

// ---------------------------------------------------------------------------
// 14 · Buildplan - the second loader ("Building your plan") with the
// commitment popup sliding over it halfway through. Under the hood this is
// where the real writing happens: one post per content pillar generates in
// parallel (in the user's voice, grounded in their scraped posts) so the
// paywall's "already written for you" strip and the endowed first draft are
// real, never mocked.
// ---------------------------------------------------------------------------

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Generation runs 4 parallel LLM calls; give it room but never trap the user.
const IDEAS_FAILSAFE_MS = 22000

export function BuildplanStep() {
    const { answers, update, goNext, role } = useOnboarding()
    const fn = firstName(answers.profile.name)
    const [doneCount, setDoneCount] = React.useState(0)
    const [popupOpen, setPopupOpen] = React.useState(false)
    const [commitment, setCommitment] = React.useState<Commitment | null>(answers.startCommitment ?? null)
    const startedRef = React.useRef(false)
    const advancedRef = React.useRef(false)
    const answersRef = React.useRef(answers)
    React.useEffect(() => {
        answersRef.current = answers
    })
    const commitmentRef = React.useRef(commitment)
    React.useEffect(() => {
        commitmentRef.current = commitment
    })

    React.useEffect(() => {
        // Cancellable: a dismiss during the popup wait must stop `run()` cleanly
        // instead of polling `commitmentRef` forever with nothing left mounted
        // to ever set it (the failsafe timer is also cleared below on unmount).
        let stopped = false

        const advance = () => {
            if (advancedRef.current || stopped) return
            advancedRef.current = true
            track('onb_buildplan_done')
            goNext()
        }

        const failsafe = setTimeout(advance, IDEAS_FAILSAFE_MS + 8000)

        async function generateIdeas() {
            const live = answersRef.current
            // Idempotent across refresh-resume: terminal states never regenerate.
            if (live.postIdeas?.length || live.postIdeasStatus === 'failed') return
            // The recap's free-text correction is the highest-signal input we have.
            const clarification = live.clarification?.trim()
            const ideas = await generatePostIdeas(
                {
                    role: live.role || role,
                    niche: live.niche,
                    primaryGoal: live.primaryGoal,
                    audience: live.audience,
                    tone: live.tone,
                    name: live.profile.name || undefined,
                    ...(clarification
                        ? { brandingContext: `The author corrected our read of them: "${clarification}"` }
                        : {}),
                },
                OB_IDEA_PILLARS.map((p) => p.category),
            )
            if (ideas.length) {
                // The endowed first draft: prefer the post filling their measured
                // gap, else the first pillar that generated.
                const gap = answersRef.current.insights?.missing[0]?.category
                const first = ideas.find((i) => i.category === gap) ?? ideas[0]
                update({
                    postIdeas: ideas,
                    postIdeasStatus: 'ready',
                    firstPostText: answersRef.current.firstPostText || first.text,
                    firstPostStyled: (answersRef.current.richSummary?.postsCount ?? 0) > 0,
                    firstPostGap: gap && first.category === gap ? gap : undefined,
                })
                track('onb_post_ideas_ready', { count: ideas.length })
            } else {
                update({ postIdeasStatus: 'failed' })
                track('onb_post_ideas_failed')
            }
        }

        async function run() {
            const ideasP = generateIdeas()
            const ideasWithTimeout = Promise.race([ideasP, wait(IDEAS_FAILSAFE_MS)])

            setDoneCount(0)
            await wait(1000)
            if (stopped) return
            setDoneCount(1)
            await wait(900)
            if (stopped) return
            setDoneCount(2)

            // Halfway: pause the checklist, ask for the commitment.
            setPopupOpen(true)
            while (!commitmentRef.current && !stopped) {
                await wait(250)
            }
            if (stopped) return
            setPopupOpen(false)

            await wait(700)
            if (stopped) return
            setDoneCount(3)
            // Hold (bounded) while the pillar posts finish writing.
            await ideasWithTimeout
            if (stopped) return
            setDoneCount(4)
            await wait(700)
            if (stopped) return
            setDoneCount(5)
            await wait(450)
            if (stopped) return
            advance()
        }

        if (!startedRef.current) {
            startedRef.current = true
            run().catch(() => {
                if (!stopped) advance()
            })
        }

        return () => {
            stopped = true
            clearTimeout(failsafe)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const pick = (option: Commitment) => {
        setCommitment(option)
        update({ startCommitment: option })
        track('onb_commitment', { commitment: option })
    }

    return (
        <div className='relative'>
            <div
                className={cn('transition-all duration-300', popupOpen && 'pointer-events-none opacity-55 blur-[2px]')}>
                <LoaderBlock
                    title='Building your plan.'
                    status={doneCount >= 3 ? 'Loading your first post ideas…' : 'Filling your 90-day calendar…'}
                    steps={BUILDPLAN_TASKS}
                    doneCount={doneCount}
                />
            </div>

            <AnimatePresence>
                {popupOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.35, ease: EASE_OUT }}
                        className='bg-card border-border-strong absolute top-1/2 left-1/2 w-[calc(100%+8px)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border px-5 py-[22px] shadow-[var(--shadow-hero)]'>
                        <h2 className='font-heading mb-2 text-xl font-semibold tracking-[-0.01em]'>
                            One more thing. When are you starting{fn ? `, ${fn}` : ''}?
                        </h2>
                        <p className='text-muted-foreground mb-4 text-[12.5px] leading-normal'>
                            {ROLE_LABELS[role]}s who pick a start date are far more likely to still be posting in month
                            two.
                        </p>
                        <div className='grid grid-cols-2 gap-[9px]'>
                            {COMMITMENT_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    type='button'
                                    onClick={() => pick(option)}
                                    className={cn(
                                        'font-heading cursor-pointer rounded-xl border p-[13px] text-sm font-semibold shadow-[var(--shadow-subtle)] transition-colors',
                                        commitment === option
                                            ? 'border-primary bg-[color-mix(in_oklch,var(--primary)_8%,var(--card))] text-[var(--orange-700)] shadow-[0_0_0_1px_var(--primary)]'
                                            : 'border-border bg-card text-foreground hover:border-primary/50',
                                    )}>
                                    {option}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
