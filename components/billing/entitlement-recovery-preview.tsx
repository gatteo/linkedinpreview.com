'use client'

import * as React from 'react'
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import posthog from 'posthog-js'

import { ApiRoutes } from '@/config/routes'
import type { RecoveryPreviewResult } from '@/lib/billing/entitlement-recovery-preview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ANALYTICS_PROPERTIES = {
    surface: 'recovery_preview',
    recovery_mode: 'synthetic_preview',
} as const

export function EntitlementRecoveryPreview() {
    const [recoveryCode, setRecoveryCode] = React.useState('')
    const [result, setResult] = React.useState<RecoveryPreviewResult | null>(null)
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const recover = React.useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault()
            const code = recoveryCode.trim()
            if (!code) return

            setSubmitting(true)
            setError(null)
            setResult(null)
            posthog?.capture('entitlement_recovery_attempted', ANALYTICS_PROPERTIES)

            try {
                const response = await fetch(ApiRoutes.BillingRecoveryPreview, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ recoveryCode: code }),
                })
                const data = (await response.json()) as RecoveryPreviewResult | { error?: string }
                if (!response.ok || !('outcome' in data)) {
                    throw new Error('error' in data ? data.error : 'Recovery preview unavailable')
                }

                setResult(data)
                if (data.outcome === 'verified_paid_restored') {
                    posthog?.capture('entitlement_recovery_succeeded', {
                        ...ANALYTICS_PROPERTIES,
                        plan: data.plan,
                    })
                }
            } catch (requestError) {
                console.error('[entitlement-recovery-preview] request failed', requestError)
                setError('The recovery preview is unavailable. Please try again.')
            } finally {
                setSubmitting(false)
            }
        },
        [recoveryCode],
    )

    const successfulRestore = result?.outcome === 'verified_paid_restored'
    const preservedException = result?.outcome === 'grandfathered_preserved'

    return (
        <Card>
            <CardHeader>
                <div className='flex items-center gap-2'>
                    <ShieldCheck className='text-primary size-5' />
                    <CardTitle>Restore Pro access</CardTitle>
                </div>
                <CardDescription>
                    Preview-only rehearsal with synthetic purchase records. It never reads or writes Stripe, billing, or
                    customer data.
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                <form onSubmit={recover} className='space-y-3'>
                    <div className='space-y-1.5'>
                        <Label htmlFor='synthetic-recovery-code'>Synthetic recovery code</Label>
                        <Input
                            id='synthetic-recovery-code'
                            value={recoveryCode}
                            onChange={(event) => setRecoveryCode(event.target.value)}
                            autoComplete='off'
                            placeholder='verified-paid-01'
                            className='max-w-sm'
                        />
                        <p className='text-muted-foreground text-xs'>
                            Try <code>verified-paid-01</code>, <code>grandfathered-lifetime</code>,{' '}
                            <code>stale-test-pro</code>, or <code>unknown-purchase</code>.
                        </p>
                    </div>
                    <Button type='submit' size='sm' disabled={submitting || !recoveryCode.trim()}>
                        {submitting && <Loader2 className='mr-2 size-4 animate-spin' />}
                        Check &amp; restore
                    </Button>
                </form>

                {result ? (
                    <div
                        role='status'
                        data-recovery-outcome={result.outcome}
                        className='bg-muted/50 flex items-start gap-2 rounded-md border p-3 text-sm'>
                        {successfulRestore || preservedException ? (
                            <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-emerald-600' />
                        ) : (
                            <XCircle className='text-destructive mt-0.5 size-4 shrink-0' />
                        )}
                        <div>
                            <p className='font-medium'>{result.message}</p>
                            <p className='text-muted-foreground mt-1 text-xs'>
                                Synthetic preview only - no entitlement or customer record changed.
                            </p>
                        </div>
                    </div>
                ) : null}

                {error ? (
                    <p role='alert' className='text-destructive text-sm'>
                        {error}
                    </p>
                ) : null}
            </CardContent>
        </Card>
    )
}
