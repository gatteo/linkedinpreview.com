'use client'

import * as React from 'react'
import { useFeaturebase } from 'featurebase-js/react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/dashboard/auth-provider'

// ---------------------------------------------------------------------------
// Email OTP sign-in. Sends a 6-digit code to the address, then verifies it to
// swap the current (guest) session for the returning account. Reusable inside a
// Card - it renders only the form controls, not its own CardHeader.
// ---------------------------------------------------------------------------

type Step = 'email' | 'code'

export function AccountLoginForm({ onCancel }: { onCancel?: () => void }) {
    const { supabase } = useAuth()
    const { shutdown: shutdownMessenger } = useFeaturebase()
    const [step, setStep] = React.useState<Step>('email')
    const [email, setEmail] = React.useState('')
    const [code, setCode] = React.useState('')
    const [submitting, setSubmitting] = React.useState(false)

    const sendCode = React.useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault()
            const address = email.trim()
            if (!address) return
            setSubmitting(true)
            try {
                const { error } = await supabase.auth.signInWithOtp({ email: address })
                if (error) throw error
                toast.success('Check your inbox for the 6-digit code')
                setStep('code')
            } catch (err) {
                console.error('[account-login] send code failed', err)
                toast.error('Could not send the code. Please try again.')
            } finally {
                setSubmitting(false)
            }
        },
        [email, supabase],
    )

    const verifyCode = React.useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault()
            const token = code.trim()
            if (!token) return
            setSubmitting(true)
            try {
                const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' })
                if (error) throw error
                // The session swapped to the returning account - clear the previous
                // user's messenger state before the reload re-boots with the new JWT.
                shutdownMessenger()
                window.location.reload()
            } catch (err) {
                console.error('[account-login] verify failed', err)
                toast.error('That code was not valid. Please try again.')
                setSubmitting(false)
            }
        },
        [code, email, supabase, shutdownMessenger],
    )

    if (step === 'code') {
        return (
            <form onSubmit={verifyCode} className='space-y-3'>
                <div className='space-y-1.5'>
                    <Label htmlFor='account-login-code'>Enter the 6-digit code</Label>
                    <Input
                        id='account-login-code'
                        inputMode='numeric'
                        autoComplete='one-time-code'
                        placeholder='123456'
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        className='max-w-sm'
                        autoFocus
                    />
                    <p className='text-muted-foreground text-xs'>Sent to {email.trim()}.</p>
                </div>
                <div className='flex gap-2'>
                    <Button type='submit' size='sm' disabled={submitting}>
                        {submitting && <Loader2 className='mr-2 size-4 animate-spin' />}
                        Verify & sign in
                    </Button>
                    <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        disabled={submitting}
                        onClick={() => setStep('email')}>
                        Use a different email
                    </Button>
                </div>
            </form>
        )
    }

    return (
        <form onSubmit={sendCode} className='space-y-3'>
            <div className='space-y-1.5'>
                <Label htmlFor='account-login-email'>Email address</Label>
                <Input
                    id='account-login-email'
                    type='email'
                    autoComplete='email'
                    placeholder='you@example.com'
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className='max-w-sm'
                    autoFocus
                />
            </div>
            <div className='flex gap-2'>
                <Button type='submit' size='sm' disabled={submitting}>
                    {submitting && <Loader2 className='mr-2 size-4 animate-spin' />}
                    Send code
                </Button>
                {onCancel ? (
                    <Button type='button' size='sm' variant='ghost' disabled={submitting} onClick={onCancel}>
                        Cancel
                    </Button>
                ) : null}
            </div>
        </form>
    )
}
