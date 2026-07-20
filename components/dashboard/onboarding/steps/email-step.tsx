'use client'

import * as React from 'react'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { CTA, FieldLabel, GhostLink, H1, Spinner, Sub } from '../primitives'

// ---------------------------------------------------------------------------
// Email capture (rail 4) - the earned-value moment, right after the audit
// reveal and before the plan build. Binding the email to the anonymous Supabase
// user converts it to permanent WITHOUT changing user.id, so every draft,
// billing, and onboarding_sessions row stays owned by the same id. Soft-gated:
// a skip or a bind failure never blocks the funnel.
//
// The ask is account recovery, and only that. Nothing here may promise delivery
// of posts, plans, or reminders: the product sends no transactional email, only
// Supabase's own address-confirmation message.
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EmailStep() {
    const { answers, update, goNext, bindEmail, userEmail } = useOnboarding()
    const [email, setEmail] = React.useState(() => answers.email ?? userEmail ?? '')
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    // Once the email is known to belong to another account we stop re-attempting
    // the bind and let Continue simply advance - a soft message, never a block.
    const [taken, setTaken] = React.useState(false)

    const valid = EMAIL_RE.test(email.trim())

    const submit = async () => {
        const value = email.trim()
        if (!valid) {
            setError('Enter a valid email address.')
            return
        }
        // Store for resume prefill regardless of the bind outcome.
        update({ email: value })

        if (taken) {
            goNext()
            return
        }

        setSubmitting(true)
        const res = await bindEmail(value)
        setSubmitting(false)

        if (res.ok) {
            track('onb_email_submit')
            goNext()
            return
        }
        if (res.taken) {
            setTaken(true)
            setError('That email already has an account. You can log in from Settings after setup.')
            return
        }
        // Any other failure is soft: never trap the user on this step.
        goNext()
    }

    const skip = () => {
        track('onb_email_skip')
        goNext()
    }

    return (
        <div className='flex flex-col'>
            <H1>Keep access to your plan</H1>
            <Sub>
                Your account lives in this browser only. Add your email and you can pick your plan back up from any
                device - without it, clearing your browser data loses it for good.
            </Sub>

            <FieldLabel>Your email</FieldLabel>
            <input
                type='email'
                inputMode='email'
                autoComplete='email'
                autoFocus
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                    setTaken(false)
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !submitting) submit()
                }}
                placeholder='you@company.com'
                aria-label='Your email'
                aria-invalid={!!error}
                className='border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20 w-full rounded-xl border px-3.5 py-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none'
            />

            {error && <p className='text-muted-foreground mt-2 text-[12.5px] leading-[1.5]'>{error}</p>}

            <div className='mt-5'>
                <CTA onClick={submit} disabled={submitting || !valid}>
                    {submitting && <Spinner className='text-primary-foreground' />}
                    Continue
                </CTA>
            </div>
            <div className='mt-3.5 text-center'>
                <GhostLink onClick={skip}>I&rsquo;ll do this later</GhostLink>
            </div>
        </div>
    )
}
