'use client'

import * as React from 'react'
import { AnimatePresence } from 'framer-motion'

import { topicsReaction, topicSuggestionsFor } from '@/config/onboarding-flow'
import { cn } from '@/lib/utils'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { Chip, CTA, FieldLabel, firstName, H1, Reaction, Sub } from '../primitives'

// ---------------------------------------------------------------------------
// 09 · Topics (rail 4/5) - the content pillars. Plays back the topics the
// analysis actually found in their posts as tappable suggestions (not
// pre-selected, so the reaction only fires once the user picks) plus niche-tuned
// suggestions as dashed "add" chips. Degrades to suggestions-only while the
// background scrape hasn't landed yet.
// ---------------------------------------------------------------------------

const MAX_TOPICS = 5

// Capitalize the first letter only. Detected topics come back lowercased from the
// model, but many carry acronyms (AWS, VPC, Git) that word-by-word title-casing
// would mangle, so everything after the first character is left untouched.
const capitalizeFirst = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

export function TopicsStep() {
    const { answers, update, goNext } = useOnboarding()
    const fn = firstName(answers.profile.name)
    const selected = answers.topics

    // Topics read from their real posts (or profile), fixed at mount so a late
    // insights payload can't reshuffle the chips mid-interaction. Surfaced as
    // suggestions the user taps to confirm - never pre-selected. The source
    // label must match where they actually came from - claiming "your posts"
    // for a profile-only analysis would be a lie.
    const [detected] = React.useState<string[]>(() => (answers.insights?.currentTopics ?? []).map(capitalizeFirst))
    const [fromPosts] = React.useState<boolean>(() => answers.insights?.kind === 'posts')

    const suggestions = React.useMemo(
        () => topicSuggestionsFor(answers.niche, [...detected, ...selected]),
        [answers.niche, detected, selected],
    )

    const toggle = (topic: string) => {
        const has = selected.includes(topic)
        const next = has ? selected.filter((t) => t !== topic) : [...selected, topic].slice(0, MAX_TOPICS)
        update({ topics: next })
        track('onb_topics_toggle', { topic, selected: !has, count: next.length })
    }

    // Free-text personalization: nothing suggested has to resonate. Typing a
    // topic adds it as a selected chip (dedupes against every visible chip,
    // case-insensitively, so "ai & software" selects the suggestion instead).
    const [draft, setDraft] = React.useState('')
    const atMax = selected.length >= MAX_TOPICS

    const addCustom = () => {
        const typed = capitalizeFirst(draft.trim()).slice(0, 48)
        setDraft('')
        if (!typed || atMax) return
        const match = [...detected, ...suggestions].find((t) => t.toLowerCase() === typed.toLowerCase())
        const topic = match ?? typed
        if (selected.some((t) => t.toLowerCase() === topic.toLowerCase())) return
        update({ topics: [...selected, topic] })
        track('onb_topics_toggle', { topic, selected: true, count: selected.length + 1, custom: true })
    }

    return (
        <div className='flex flex-col'>
            <H1>{fn ? `Let’s lock in what you post about, ${fn}.` : 'Let’s lock in what you post about.'}</H1>
            <Sub className='mb-4'>
                {detected.length > 0
                    ? `${fromPosts ? 'Your recent posts touched' : 'Your profile points at'} ${detected.length} ${detected.length === 1 ? 'topic' : 'topics'}, and I suggested some more. The accounts that grow fastest own 2 or 3.`
                    : 'The accounts that grow fastest pick 2 or 3 pillars and go deep. Choose the ones you want to own.'}
            </Sub>

            {detected.length > 0 && (
                <>
                    <FieldLabel>{fromPosts ? 'From your recent posts' : 'From your profile'}</FieldLabel>
                    <div className='mb-4 flex flex-wrap gap-2'>
                        {detected.map((t) => (
                            <Chip key={t} selected={selected.includes(t)} onClick={() => toggle(t)}>
                                {t}
                            </Chip>
                        ))}
                    </div>
                </>
            )}

            <FieldLabel>
                {detected.length > 0
                    ? 'My suggestions for you'
                    : `Suggested${answers.niche ? ` for ${answers.niche}` : ''}`}
            </FieldLabel>
            <div className='mb-4 flex flex-wrap gap-2'>
                {suggestions.map((t) => (
                    <Chip key={t} add onClick={() => toggle(t)}>
                        {t}
                    </Chip>
                ))}
                {selected
                    .filter((t) => !detected.includes(t))
                    .map((t) => (
                        <Chip key={t} selected onClick={() => toggle(t)}>
                            {t}
                        </Chip>
                    ))}
                <span
                    className={cn(
                        'focus-within:border-primary/60 inline-flex items-center gap-1 rounded-full border border-dashed px-[13px] py-2 text-[13px] font-medium transition-colors',
                        atMax && 'opacity-40',
                    )}>
                    <span className='text-primary font-bold'>+</span>
                    <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                addCustom()
                            }
                        }}
                        onBlur={() => draft.trim() && addCustom()}
                        placeholder='Add your own topic'
                        aria-label='Add your own topic'
                        maxLength={48}
                        disabled={atMax}
                        className='placeholder:text-muted-foreground w-[138px] bg-transparent outline-none disabled:pointer-events-none'
                    />
                </span>
            </div>

            <AnimatePresence initial={false}>
                {selected.length > 0 && <Reaction key={selected.length} reaction={topicsReaction(selected.length)} />}
            </AnimatePresence>

            <CTA onClick={goNext} disabled={selected.length === 0}>
                Continue
            </CTA>
        </div>
    )
}
