'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, SparklesIcon } from 'lucide-react'

import { resolveRole, ROLE_BENCHMARKS, rolePlural } from '@/config/onboarding-personalization'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { firstName, H2, Sub } from '../primitives'

// ---------------------------------------------------------------------------
// Reinforce - the benchmark breather before "building": what strong presences
// in the user's role visibly have in common (honest industry patterns from
// config, never fabricated counts), plus their REAL follower number when the
// rich scrape has landed. Sits late in the flow to buy the scrape's last
// seconds and to set up the insight cards ("next: how your profile compares").
// ---------------------------------------------------------------------------

export function ReinforceStep() {
    const { answers } = useOnboarding()
    const role = resolveRole(answers.role)
    const lines = ROLE_BENCHMARKS[role]
    const followers = answers.richSummary?.followers ?? null
    const fn = firstName(answers.profile.name)

    React.useEffect(() => {
        track('onb_reinforce_view', { role, hasFollowers: followers !== null })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-6'>
            <motion.div variants={staggerItem} className='flex items-center gap-2.5'>
                <span className='bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-xl'>
                    <SparklesIcon className='size-[18px]' />
                </span>
                <span className='text-muted-foreground font-mono text-[11px] font-semibold tracking-[0.12em] uppercase'>
                    The pattern
                </span>
            </motion.div>

            <motion.div variants={fadeUp}>
                <H2 className='text-[22px]'>What strong {rolePlural(role).toLowerCase()} presences have in common</H2>
            </motion.div>

            <motion.ul variants={staggerItem} className='flex flex-col gap-2.5'>
                {lines.map((line) => (
                    <li key={line} className='flex items-start gap-3'>
                        <span className='bg-primary/10 text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full'>
                            <CheckIcon className='size-3' />
                        </span>
                        <span className='text-foreground text-[14.5px] leading-snug'>{line}</span>
                    </li>
                ))}
            </motion.ul>

            {followers !== null && followers > 0 && (
                <motion.div
                    variants={staggerItem}
                    style={{ background: 'color-mix(in oklch, var(--primary) 6%, transparent)' }}
                    className='border-primary/20 rounded-xl border px-[15px] py-[13px]'>
                    <p className='text-foreground text-sm leading-snug'>
                        {fn ? `${fn}, you` : 'You'} have{' '}
                        <span className='font-semibold'>{followers.toLocaleString()} followers</span>. That audience is
                        already there - most people just post too rarely to reach it.
                    </p>
                </motion.div>
            )}

            <motion.div variants={staggerItem}>
                <Sub>Next: we build your system, then show you how your own profile compares.</Sub>
            </motion.div>
        </motion.div>
    )
}
