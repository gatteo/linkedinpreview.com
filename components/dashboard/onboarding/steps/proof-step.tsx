'use client'

import { OB_PROOF, OB_TESTIMONIALS } from '@/config/onboarding-flow'
import { rolePlural } from '@/config/onboarding-personalization'

import { useOnboarding } from '../context'
import { CTA, firstName, H1, ReviewCard } from '../primitives'

// ---------------------------------------------------------------------------
// 07 · Proof - the momentum beat that spends the trust the recap just built,
// placed right before the flow asks for more effort. A staggered review wall
// that fades under a sticky CTA.
// ---------------------------------------------------------------------------

export function ProofStep() {
    const { answers, goNext, role } = useOnboarding()
    const fn = firstName(answers.profile.name)
    const who = answers.niche ? `${rolePlural(role)} in ${answers.niche}` : rolePlural(role)

    return (
        <div className='flex flex-col'>
            <H1 className='mb-5'>
                We&rsquo;ve helped over {OB_PROOF.helpedCount} {who} grow on LinkedIn.
                <br />
                <br />
                {fn ? `Now it’s your turn, ${fn}.` : 'Now it’s your turn.'}
            </H1>
            <div className='relative'>
                <div
                    className='max-h-[380px] columns-2 gap-2 overflow-hidden'
                    style={{
                        maskImage: 'linear-gradient(to bottom, #000 58%, transparent 97%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, #000 58%, transparent 97%)',
                    }}>
                    {OB_TESTIMONIALS.map((t, i) => (
                        <ReviewCard key={i} t={t} followersOnly compact />
                    ))}
                </div>
                <div
                    className='sticky bottom-0 -mt-32 pt-[68px] pb-0.5'
                    style={{ background: 'linear-gradient(to bottom, transparent, var(--card) 52%)' }}>
                    <CTA onClick={goNext}>Let&rsquo;s do it</CTA>
                </div>
            </div>
        </div>
    )
}
