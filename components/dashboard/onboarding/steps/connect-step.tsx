'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon, LinkedinIcon, LockIcon } from 'lucide-react'

import { isLikelyProfileUrl } from '@/lib/linkedin/profile-url'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { Input } from '@/components/ui/input'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { CTA, GhostLink, H1, Sub } from '../primitives'

// ---------------------------------------------------------------------------
// 01 · Connect - two ways in (OAuth or a pasted public URL) so users who won't
// do OAuth still convert. Both paths land on the fetching loader; a quiet skip
// hops straight to the questions for the rare hard-no.
// ---------------------------------------------------------------------------

const ERROR_COPY: Record<string, string> = {
    denied: 'No problem - paste your profile URL below instead.',
    error: "That didn't go through. Try again or paste your URL below.",
    session: 'Your session expired. Try connecting again.',
    unavailable: 'LinkedIn connect is briefly unavailable. Paste your URL instead.',
}

export function ConnectStep() {
    const { answers, update, goNext, goTo, connectLinkedin, linkedinError } = useOnboarding()
    const [url, setUrl] = React.useState(answers.profileUrl ?? '')
    const [urlError, setUrlError] = React.useState(false)

    const connect = () => {
        track('onb_connect_method', { method: 'oauth' })
        connectLinkedin()
    }

    const submitUrl = () => {
        const trimmed = url.trim()
        if (!trimmed) return
        if (!isLikelyProfileUrl(trimmed)) {
            setUrlError(true)
            return
        }
        setUrlError(false)
        // Clear any prior enrichment so the fetching step re-reads this URL from
        // scratch. A DIFFERENT URL also drops the previous profile's identity +
        // inferences (else two profiles mix); an OAuth identity stays.
        const changedUrl = trimmed !== answers.profileUrl
        update({
            profileUrl: trimmed,
            enrichConfidence: undefined,
            mirrorFetchOk: undefined,
            richStatus: undefined,
            richSummary: undefined,
            insights: undefined,
            insightsStatus: undefined,
            postIdeas: undefined,
            postIdeasStatus: undefined,
            firstPostGap: undefined,
            ...(changedUrl && !answers.linkedinConnected
                ? {
                      profile: { name: '', headline: '', avatarUrl: '' },
                      identity: undefined,
                      language: undefined,
                      niche: undefined,
                      toneSummary: undefined,
                      opportunityLine: undefined,
                  }
                : {}),
        })
        track('onb_connect_method', { method: 'url' })
        goNext()
    }

    const skipAll = () => {
        track('onb_connect_method', { method: 'skip' })
        goTo('goal')
    }

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col'>
            <motion.div variants={staggerItem}>
                <H1>Let&rsquo;s build a strategy, just for you.</H1>
                <Sub>
                    Connect LinkedIn so I can build a personalized plan on <strong>your real profile data</strong>, not
                    a generic template.
                </Sub>
            </motion.div>

            <motion.div variants={staggerItem}>
                <CTA onClick={connect}>
                    <LinkedinIcon className='size-[18px] fill-current' strokeWidth={0} />
                    Connect LinkedIn
                </CTA>
                {linkedinError && ERROR_COPY[linkedinError] && (
                    <p className='text-destructive mt-2 text-xs'>{ERROR_COPY[linkedinError]}</p>
                )}
            </motion.div>

            <motion.div
                variants={staggerItem}
                className='text-muted-foreground my-4 flex items-center gap-3 font-mono text-[10.5px] tracking-[0.1em] uppercase before:h-px before:flex-1 before:bg-[var(--border)] after:h-px after:flex-1 after:bg-[var(--border)]'>
                or paste your profile URL
            </motion.div>

            <motion.div variants={staggerItem} className='flex flex-col gap-2.5'>
                <Input
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value)
                        if (urlError) setUrlError(false)
                    }}
                    placeholder='linkedin.com/in/your-name'
                    aria-label='Your LinkedIn profile URL'
                    aria-invalid={urlError}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') submitUrl()
                    }}
                    className='h-[46px] rounded-xl text-sm'
                />
                {urlError && (
                    <p className='text-destructive text-xs'>
                        That doesn&rsquo;t look like a profile URL - try linkedin.com/in/your-name.
                    </p>
                )}
                <CTA variant='outline' onClick={submitUrl} disabled={!url.trim()}>
                    Use profile URL
                    <ArrowRightIcon className='size-[18px]' />
                </CTA>
            </motion.div>

            <motion.div
                variants={staggerItem}
                className='text-muted-foreground mt-[18px] flex items-center gap-2.5 text-[12.5px]'>
                <LockIcon className='text-petrol-500 size-[15px]' />
                <span>Read-only. Only you can see this data.</span>
                <GhostLink onClick={skipAll} className='ml-auto shrink-0'>
                    Skip for now
                </GhostLink>
            </motion.div>
        </motion.div>
    )
}
