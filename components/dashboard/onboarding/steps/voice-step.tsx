'use client'

import { AnimatePresence } from 'framer-motion'

import { OB_VOICES, obVoiceFromTone, type ObVoice } from '@/config/onboarding-flow'
import { toneFromSummary } from '@/config/onboarding-personalization'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { iconFor } from '../icons'
import { ChoiceCard, CTA, firstName, H1, Reaction } from '../primitives'

// ---------------------------------------------------------------------------
// 08 · Voice (rail 3/5) - the writing voice. Pre-selected from the inferred
// tone summary when the profile fetch produced one.
// ---------------------------------------------------------------------------

export function VoiceStep() {
    const { answers, update, goNext } = useOnboarding()
    const fn = firstName(answers.profile.name)
    const inferred = obVoiceFromTone(answers.tone ?? toneFromSummary(answers.toneSummary))
    const selected = answers.voiceId ?? inferred?.id

    const choose = (voice: ObVoice) => {
        update({ voiceId: voice.id, tone: voice.tone })
        track('onb_voice_set', { voice: voice.id, tone: voice.tone })
    }

    const reaction = selected ? OB_VOICES.find((v) => v.id === selected) : null

    return (
        <div className='flex flex-col'>
            <H1 className='mb-5'>
                {fn ? `${fn}, which voice sounds most like you?` : 'Which voice sounds most like you?'}
            </H1>
            <div className='mb-[18px] grid gap-2.5'>
                {OB_VOICES.map((voice) => (
                    <ChoiceCard
                        key={voice.id}
                        icon={iconFor(voice.icon)}
                        title={voice.title}
                        desc={voice.desc}
                        selected={selected === voice.id}
                        onClick={() => choose(voice)}
                    />
                ))}
            </div>
            <AnimatePresence initial={false}>
                {reaction && <Reaction key={reaction.id} reaction={reaction.reaction} />}
            </AnimatePresence>
            <CTA
                onClick={() => {
                    // A kept pre-selection still counts as a choice.
                    if (!answers.voiceId && reaction) choose(reaction)
                    goNext()
                }}
                disabled={!selected}>
                Continue
            </CTA>
        </div>
    )
}
