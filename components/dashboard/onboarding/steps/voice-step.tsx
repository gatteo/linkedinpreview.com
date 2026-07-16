'use client'

import { AnimatePresence } from 'framer-motion'

import { OB_VOICES, obVoiceFromTone, type ObVoice } from '@/config/onboarding-flow'
import { toneFromSummary } from '@/config/onboarding-personalization'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { iconFor } from '../icons'
import { ChoiceCard, CTA, firstName, H1, Reaction } from '../primitives'

// ---------------------------------------------------------------------------
// 08 · Voice (rail 3/5) - the writing voice. The inferred tone is surfaced as a
// "Suggested for you" hint, not a pre-selection: the user still makes the pick,
// so the reaction insight only appears once they actually choose.
// ---------------------------------------------------------------------------

export function VoiceStep() {
    const { answers, update, goNext } = useOnboarding()
    const fn = firstName(answers.profile.name)
    const inferred = obVoiceFromTone(answers.tone ?? toneFromSummary(answers.toneSummary))
    const selected = answers.voiceId

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
                        badge={inferred?.id === voice.id ? 'Suggested for you' : undefined}
                        onClick={() => choose(voice)}
                    />
                ))}
            </div>
            <AnimatePresence initial={false}>
                {reaction && <Reaction key={reaction.id} reaction={reaction.reaction} />}
            </AnimatePresence>
            <CTA onClick={goNext} disabled={!selected}>
                Continue
            </CTA>
        </div>
    )
}
