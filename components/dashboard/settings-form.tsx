'use client'

import * as React from 'react'
import { useFeaturebase } from 'featurebase-js/react'
import { Loader2, MonitorIcon, MoonIcon, SunIcon, Trash2Icon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import { PRICING } from '@/config/pricing'
import { usePlan } from '@/hooks/use-plan'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/dashboard/auth-provider'
import { LinkedInConnection } from '@/components/dashboard/linkedin-connection'
import { useUpgradePrompt } from '@/components/dashboard/upgrade-provider'

const THEME_OPTIONS = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'System', icon: MonitorIcon },
] as const

export function SettingsForm() {
    const { supabase } = useAuth()
    const { theme, setTheme } = useTheme()
    const { shutdown: shutdownMessenger } = useFeaturebase()
    const [isResetting, setIsResetting] = React.useState(false)

    const handleReset = React.useCallback(async () => {
        setIsResetting(true)
        try {
            const { error: draftsError } = await supabase.from('drafts').delete().neq('id', '')
            if (draftsError) throw draftsError

            const { error: brandingError } = await supabase.from('branding').delete().neq('user_id', '')
            if (brandingError) throw brandingError

            const { error: analysesError } = await supabase.from('post_analyses').delete().neq('id', '')
            if (analysesError) throw analysesError

            const { error: strategyError } = await supabase.from('strategy').delete().neq('user_id', '')
            if (strategyError) throw strategyError

            toast.success('All data has been deleted')
            shutdownMessenger()
            window.location.reload()
        } catch {
            toast.error('Failed to reset data')
        } finally {
            setIsResetting(false)
        }
    }, [supabase, shutdownMessenger])

    return (
        <div className='max-w-2xl space-y-6 p-4 lg:p-6'>
            {/* Plan & billing */}
            <BillingCard />

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Choose how the dashboard looks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='flex gap-2'>
                        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                            <Button
                                key={value}
                                variant={theme === value ? 'default' : 'outline'}
                                size='sm'
                                onClick={() => setTheme(value)}
                                className='flex items-center gap-2'>
                                <Icon className='size-4' />
                                {label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* LinkedIn connection */}
            <LinkedInConnection />

            {/* Reset */}
            <Card className='border-destructive/50'>
                <CardHeader>
                    <CardTitle className='text-destructive'>Danger Zone</CardTitle>
                    <CardDescription>Permanently delete all your posts, branding data, and settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant='destructive' disabled={isResetting}>
                                {isResetting ? (
                                    <Loader2 className='mr-2 size-4 animate-spin' />
                                ) : (
                                    <Trash2Icon className='mr-2 size-4' />
                                )}
                                Reset All Data
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete all your drafts, branding, and settings. This action
                                    cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleReset}
                                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                                    Delete Everything
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Plan & billing card
//
// Shows the current plan and hands subscription management (cancel, payment
// method, invoices) to the Stripe Customer Portal - the portal button only
// renders when the billing row actually carries a Stripe customer.
// ---------------------------------------------------------------------------

function BillingCard() {
    const { plan, billing, isLoading } = usePlan()
    const { openUpgrade } = useUpgradePrompt()
    const [opening, setOpening] = React.useState(false)

    const openPortal = React.useCallback(async () => {
        setOpening(true)
        try {
            const res = await fetch('/api/billing/portal', { method: 'POST' })
            const data = (await res.json()) as { url?: string; error?: string }
            if (!res.ok || !data.url) throw new Error(data.error ?? 'Portal unavailable')
            window.location.href = data.url
        } catch (err) {
            console.error('[settings] portal open failed', err)
            toast.error('Could not open the billing portal. Please try again.')
            setOpening(false)
        }
    }, [])

    const renewsAt = billing.planRenewsAt
        ? new Date(billing.planRenewsAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null

    return (
        <Card>
            <CardHeader>
                <CardTitle>Plan &amp; billing</CardTitle>
                <CardDescription>Your current plan and payment details.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                        <p className='text-sm font-semibold'>
                            {isLoading
                                ? 'Loading…'
                                : plan === 'lifetime'
                                  ? 'Lifetime - Founder Pass'
                                  : plan === 'pro'
                                    ? `Pro - ${PRICING.monthly.display}/mo`
                                    : 'Free plan'}
                        </p>
                        <p className='text-muted-foreground mt-0.5 text-xs'>
                            {isLoading
                                ? ''
                                : plan === 'lifetime'
                                  ? 'Paid once, yours forever - no renewals.'
                                  : plan === 'pro'
                                    ? renewsAt
                                        ? `Renews on ${renewsAt}. Cancel anytime.`
                                        : 'Billed monthly. Cancel anytime.'
                                    : 'The core editor and previews, free forever.'}
                        </p>
                    </div>
                    {isLoading ? null : plan === 'free' ? (
                        <Button size='sm' onClick={() => openUpgrade('settings')}>
                            Upgrade
                        </Button>
                    ) : billing.stripeCustomerId ? (
                        <Button size='sm' variant='outline' onClick={openPortal} disabled={opening}>
                            {opening && <Loader2 className='mr-2 size-4 animate-spin' />}
                            {plan === 'pro' ? 'Manage subscription' : 'Invoices & billing history'}
                        </Button>
                    ) : null}
                </div>
                {plan === 'pro' && billing.stripeCustomerId && (
                    <p className='text-muted-foreground mt-3 text-xs'>
                        Manage subscription opens the secure Stripe portal where you can cancel, change the payment
                        method, or download invoices.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
