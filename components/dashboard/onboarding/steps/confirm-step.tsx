'use client'

import * as React from 'react'
import { ArrowRightIcon, CheckIcon, Loader2Icon } from 'lucide-react'

import { usePlan } from '@/hooks/use-plan'

import { useOnboarding } from '../context'
import { CTA, Eyebrow, firstName, H1, Sub } from '../primitives'

// ---------------------------------------------------------------------------
// 16 · Confirm - the instant-value payoff. Payment confirmed (or free plan
// kept), first post already waiting in the dashboard editor.
// ---------------------------------------------------------------------------

export function ConfirmStep() {
    const { answers, converted, complete } = useOnboarding()
    const { isPaid } = usePlan()
    const [submitting, setSubmitting] = React.useState(false)
    const fn = firstName(answers.profile.name)

    // The Stripe webhook may not have landed yet (PlanProvider.refresh re-polls).
    // Don't claim the upgrade until the plan is actually confirmed paid.
    const confirmingUpgrade = converted && !isPaid

    return (
        <div className='flex flex-col text-center'>
            <div className='animate-ob-pop bg-success-soft border-success text-success mx-auto mt-1 mb-[18px] grid size-[60px] place-items-center rounded-full border'>
                <CheckIcon className='size-[30px]' strokeWidth={2.5} />
            </div>
            <Eyebrow className='text-success text-center'>{converted ? 'You’re in' : 'You’re all set'}</Eyebrow>
            <H1 className='text-center'>{fn ? `Welcome, ${fn}.` : 'Welcome.'}</H1>
            <Sub className='mx-auto mb-6 text-center'>
                {confirmingUpgrade
                    ? 'Payment received - your Pro features are unlocking now. Your first post is ready.'
                    : converted
                      ? 'Payment confirmed. Time to go make some noise.'
                      : 'Your plan is saved and your first post is ready whenever you are.'}
            </Sub>
            <CTA
                disabled={submitting}
                onClick={() => {
                    setSubmitting(true)
                    complete()
                }}>
                {submitting && <Loader2Icon className='size-4 animate-spin' />}
                Open my dashboard
                <ArrowRightIcon className='size-[18px]' />
            </CTA>
        </div>
    )
}
