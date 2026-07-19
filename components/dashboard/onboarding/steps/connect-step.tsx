'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon, LinkedinIcon, LockIcon } from 'lucide-react'

import { normalizeProfileUrl } from '@/lib/linkedin/profile-url'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { Input } from '@/components/ui/input'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { CTA, H1, Sub } from '../primitives'

// ---------------------------------------------------------------------------
// 01 · Connect - the audit's front door, framed around what they get. Two ways
// in (OAuth or a pasted profile URL / copied vanity slug) and both land on the
// fetching loader. A typed human name is NOT accepted - slugifying a name into a
// guessed URL matched the wrong person or hung the scraper, so we require a real
// profile reference. No skip: connecting is what makes the audit real - the only
// way around is the fetch-failure card's escape hatch.
// ---------------------------------------------------------------------------

const ERROR_COPY: Record<string, string> = {
    denied: 'No problem - paste your profile URL below instead.',
    error: "That didn't go through. Try again or paste your URL below.",
    session: 'Your session expired. Try connecting again.',
    unavailable: 'LinkedIn connect is briefly unavailable. Paste your URL instead.',
}

export function ConnectStep() {
    const { answers, update, goNext, connectLinkedin, linkedinError } = useOnboarding()
    const [url, setUrl] = React.useState(answers.profileUrl ?? '')
    const [urlError, setUrlError] = React.useState(false)

    const connect = () => {
        track('onb_connect_method', { method: 'oauth' })
        connectLinkedin()
    }

    const submitUrl = () => {
        if (!url.trim()) return
        // A real profile URL or a copied vanity slug only - normalizeProfileUrl
        // rejects a typed human name (with spaces). We used to slugify names into
        // a best guess, but that hit Scrapingdog with wrong/non-existent slugs
        // (a wrong-person match, or a ~25s hang then 400 - the launch-week
        // fast-tier failures), so names are no longer accepted.
        const normalized = normalizeProfileUrl(url)
        if (!normalized) {
            setUrlError(true)
            return
        }
        setUrlError(false)
        // Clear any prior enrichment so the fetching step re-reads this URL from
        // scratch. A DIFFERENT URL also drops the previous profile's identity +
        // inferences (else two profiles mix); an OAuth identity stays.
        const changedUrl = normalized !== answers.profileUrl
        update({
            profileUrl: normalized,
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

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col'>
            <motion.div variants={staggerItem}>
                <H1>First, let&rsquo;s audit your LinkedIn.</H1>
                <Sub>
                    I&rsquo;ll read your profile and recent posts to show you{' '}
                    <strong>what&rsquo;s working, what&rsquo;s missing</strong>, and the plan that fixes it - built on
                    your real data, not a template.
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
                        That doesn&rsquo;t look like a LinkedIn profile URL. Paste your{' '}
                        <b className='font-semibold'>linkedin.com/in/&hellip;</b> link (open your profile and copy the
                        address).
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
                <span>Read-only. We never post or message anyone. Only you can see this data.</span>
            </motion.div>
        </motion.div>
    )
}
