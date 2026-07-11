'use client'

import * as React from 'react'
import { AnimatePresence } from 'framer-motion'

import { topicsReaction, topicSuggestionsFor } from '@/config/onboarding-flow'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { Chip, CTA, FieldLabel, firstName, H1, Reaction, Sub } from '../primitives'

// ---------------------------------------------------------------------------
// 09 · Topics (rail 4/5) - the content pillars. Plays back the topics the
// analysis actually found in their posts (pre-selected) plus niche-tuned
// suggestions as dashed "add" chips. Degrades to suggestions-only while the
// background scrape hasn't landed yet.
// ---------------------------------------------------------------------------

const MAX_TOPICS = 5

export function TopicsStep() {
    const { answers, update, goNext } = useOnboarding()
    const fn = firstName(answers.profile.name)
    const selected = answers.topics

    // Topics read from their real posts (or profile), fixed at mount so a late
    // insights payload can't reshuffle the chips mid-interaction.
    const [detected] = React.useState<string[]>(() => answers.insights?.currentTopics ?? [])
    // Pre-select the detected topics once, when the user hasn't picked any yet.
    const seededRef = React.useRef(false)
    React.useEffect(() => {
        if (seededRef.current) return
        seededRef.current = true
        if (selected.length === 0 && detected.length > 0) {
            update({ topics: detected.slice(0, 3) })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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

    const [touched, setTouched] = React.useState(false)

    return (
        <div className='flex flex-col'>
            <H1>{fn ? `Let’s lock in what you post about, ${fn}.` : 'Let’s lock in what you post about.'}</H1>
            <Sub className='mb-4'>
                {detected.length > 0
                    ? `Your recent posts touched ${detected.length} ${detected.length === 1 ? 'topic' : 'topics'}, and I suggested some more. The accounts that grow fastest own 2 or 3.`
                    : 'The accounts that grow fastest pick 2 or 3 pillars and go deep. Choose the ones you want to own.'}
            </Sub>

            {detected.length > 0 && (
                <>
                    <FieldLabel>From your recent posts</FieldLabel>
                    <div className='mb-4 flex flex-wrap gap-2'>
                        {detected.map((t) => (
                            <Chip
                                key={t}
                                selected={selected.includes(t)}
                                onClick={() => {
                                    setTouched(true)
                                    toggle(t)
                                }}>
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
                    <Chip
                        key={t}
                        add
                        onClick={() => {
                            setTouched(true)
                            toggle(t)
                        }}>
                        {t}
                    </Chip>
                ))}
                {selected
                    .filter((t) => !detected.includes(t))
                    .map((t) => (
                        <Chip
                            key={t}
                            selected
                            onClick={() => {
                                setTouched(true)
                                toggle(t)
                            }}>
                            {t}
                        </Chip>
                    ))}
            </div>

            <AnimatePresence initial={false}>
                {(touched || selected.length > 0) && selected.length > 0 && (
                    <Reaction key={selected.length} reaction={topicsReaction(selected.length)} />
                )}
            </AnimatePresence>

            <CTA onClick={goNext} disabled={selected.length === 0}>
                Continue
            </CTA>
        </div>
    )
}
