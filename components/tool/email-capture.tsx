'use client'

import * as React from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'

import { Routes } from '@/config/routes'
import { useAnonymousAuth } from '@/hooks/use-anonymous-auth'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EmailCapture({ onDismiss }: { onDismiss: () => void }) {
    const [email, setEmail] = React.useState('')
    const [consent, setConsent] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const [submitted, setSubmitted] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const { ensureSession } = useAnonymousAuth()

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const normalizedEmail = email.trim().toLowerCase()
        if (!EMAIL_RE.test(normalizedEmail)) {
            setError('Enter a valid email address.')
            return
        }
        if (!consent) {
            setError('Please confirm that you want product updates.')
            return
        }

        setSubmitting(true)
        setError(null)
        const authenticated = await ensureSession()
        if (!authenticated) {
            setError('We could not start a secure session. Please try again.')
            setSubmitting(false)
            return
        }

        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail, marketingConsent: true }),
            })
            if (!response.ok) {
                setError('We could not save that right now. Please try again.')
                return
            }

            const data = (await response.json()) as { captured?: boolean }
            if (data.captured) posthog.capture('lead_captured', { source: 'free_tool_post_copy' })
            setSubmitted(true)
        } catch {
            setError('We could not save that right now. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <section className='border-border bg-muted/40 mt-3 rounded-lg border p-3' aria-live='polite'>
                <p className='text-sm font-medium'>You&apos;re on the list.</p>
                <p className='text-muted-foreground mt-0.5 text-xs'>
                    We&apos;ll only email product updates and offers you opt into.
                </p>
                <Button type='button' variant='ghost' size='sm' className='mt-1.5 h-7 px-2 text-xs' onClick={onDismiss}>
                    Close
                </Button>
            </section>
        )
    }

    return (
        <section className='border-border bg-muted/40 mt-3 rounded-lg border p-3' aria-labelledby='email-capture-title'>
            <div className='flex items-start justify-between gap-3'>
                <div>
                    <p id='email-capture-title' className='text-sm font-medium'>
                        Want product updates?
                    </p>
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                        Optional. Get occasional tips and new Pro features.
                    </p>
                </div>
                <Button type='button' variant='ghost' size='sm' className='h-7 px-2 text-xs' onClick={onDismiss}>
                    Not now
                </Button>
            </div>
            <form className='mt-3 flex flex-col gap-2' onSubmit={submit}>
                <div className='flex gap-2'>
                    <Input
                        type='email'
                        inputMode='email'
                        autoComplete='email'
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder='you@company.com'
                        aria-label='Email for product updates'
                        aria-invalid={!!error}
                        disabled={submitting}
                    />
                    <Button type='submit' size='sm' disabled={submitting}>
                        {submitting ? 'Saving...' : 'Keep me posted'}
                    </Button>
                </div>
                <div className='flex items-start gap-2'>
                    <Checkbox
                        id='email-capture-consent'
                        checked={consent}
                        onCheckedChange={(checked) => setConsent(checked === true)}
                        disabled={submitting}
                    />
                    <label
                        htmlFor='email-capture-consent'
                        className='text-muted-foreground cursor-pointer text-xs leading-4'>
                        I agree to receive product updates and offers by email. See the{' '}
                        <Link href={Routes.Privacy} className='text-primary underline underline-offset-2'>
                            privacy policy
                        </Link>
                        .
                    </label>
                </div>
                {error && <p className='text-destructive text-xs'>{error}</p>}
            </form>
        </section>
    )
}
