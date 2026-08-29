'use client'

import { useOnboarding } from '../context'
import { CTA, H1, Sub } from '../primitives'

// ---------------------------------------------------------------------------
// 07 · Plan setup - a clear transition before the flow asks for more effort.
// ---------------------------------------------------------------------------

export function ProofStep() {
    const { goNext } = useOnboarding()

    return (
        <div className='flex flex-col'>
            <H1>Build a plan that fits how you work.</H1>
            <Sub>
                Your goals, topics, and voice guide the first version. You can keep using the free tools either way.
            </Sub>
            <CTA onClick={goNext}>Continue</CTA>
        </div>
    )
}
