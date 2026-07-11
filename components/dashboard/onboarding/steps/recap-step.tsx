'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { obGoal } from '@/config/onboarding-flow'
import { ROLE_LABELS } from '@/config/onboarding-personalization'
import { EASE_OUT } from '@/lib/motion'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { CTA, firstName, GhostLink, H1 } from '../primitives'

// ---------------------------------------------------------------------------
// 06 · Recap - the comprehension check: "here's how I see you", values as
// highlighted tokens. "Something's off?" reveals a free-text correction that is
// stored as `clarification` and fed into the AI prompts, so a correction
// genuinely reshapes the generated strategy.
// ---------------------------------------------------------------------------

function Tok({ children }: { children: React.ReactNode }) {
    return (
        <span className='bg-accent border-primary/30 inline-block rounded-[9px] border px-2.5 py-0.5 leading-normal font-semibold whitespace-nowrap text-[var(--orange-700)]'>
            {children}
        </span>
    )
}

export function RecapStep() {
    const { answers, update, goNext, role } = useOnboarding()
    const fn = firstName(answers.profile.name)
    const [correcting, setCorrecting] = React.useState(false)
    const goal = obGoal(answers.goalId)

    const submit = () => {
        track('onb_recap_confirm', { corrected: !!answers.clarification?.trim() })
        goNext()
    }

    return (
        <div className='flex flex-col'>
            <H1>{fn ? `Here’s how I see you, ${fn}.` : 'Here’s how I see you.'}</H1>
            <p className='font-heading text-foreground mt-2 mb-6 text-[22px] leading-[2.35] font-medium tracking-[-0.01em]'>
                You&rsquo;re a <Tok>{ROLE_LABELS[role]}</Tok>{' '}
                {answers.niche && (
                    <>
                        in <Tok>{answers.niche}</Tok>
                    </>
                )}
                {answers.language && (
                    <>
                        , writing in <Tok>{answers.language}</Tok>
                    </>
                )}{' '}
                to <Tok>{goal.restated}</Tok>.
            </p>

            <AnimatePresence initial={false}>
                {correcting && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                        className='overflow-hidden'>
                        <div className='mb-5 flex flex-col gap-2'>
                            <textarea
                                value={answers.clarification ?? ''}
                                onChange={(e) => update({ clarification: e.target.value })}
                                placeholder="e.g. I'm actually a fractional CMO, and I write mostly in German"
                                autoFocus
                                rows={3}
                                className='border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full resize-none rounded-xl border px-3.5 py-3 text-sm focus-visible:ring-3 focus-visible:outline-none'
                            />
                            <p className='text-muted-foreground text-xs'>
                                We&rsquo;ll fold this into everything we build for you.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CTA onClick={submit}>{correcting ? 'Save and continue' : 'That’s me, continue'}</CTA>
            <div className='mt-3.5 text-center'>
                {!correcting && (
                    <GhostLink
                        onClick={() => {
                            setCorrecting(true)
                            track('onb_recap_correct_open')
                        }}>
                        Something&rsquo;s off? Correct it
                    </GhostLink>
                )}
            </div>
        </div>
    )
}
