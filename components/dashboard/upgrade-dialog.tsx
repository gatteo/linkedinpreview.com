'use client'

import * as React from 'react'
import { ArrowLeftIcon, CheckIcon } from 'lucide-react'

import { AI_METERED_NOTE, COMPETITOR_PRICE_RANGE, MONEY_BACK_DAYS, PRICING, type CheckoutPlan } from '@/config/pricing'
import { usePlan } from '@/hooks/use-plan'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { OnboardingCheckout } from '@/components/dashboard/onboarding/steps/checkout'

import { track } from './onboarding/ai'

type UpgradeDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Where the prompt fired from, for analytics (e.g. 'ai_limit'). */
    reason?: string
    /** Set when a hosted-checkout return already completed the purchase - the dialog opens straight in its success state. */
    completedPlan?: CheckoutPlan | null
}

export function UpgradeDialog({ open, onOpenChange, reason, completedPlan }: UpgradeDialogProps) {
    const { isPaid, refresh } = usePlan()
    const [selected, setSelected] = React.useState<CheckoutPlan | null>(null)
    const [error, setError] = React.useState(false)
    const [succeeded, setSucceeded] = React.useState(false)

    React.useEffect(() => {
        if (open) {
            setSelected(completedPlan ?? null)
            setError(false)
            setSucceeded(!!completedPlan)
            if (!completedPlan) track('upgrade_prompt_view', { reason })
        }
    }, [open, reason, completedPlan])

    const choose = (plan: CheckoutPlan) => {
        track('upgrade_select', { plan, reason })
        setError(false)
        setSelected(plan)
    }

    const onComplete = () => {
        track('upgrade_success', { plan: selected, reason })
        refresh()
        setSucceeded(true)
    }

    if (succeeded) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className='sm:max-w-lg'>
                    <div className='flex flex-col items-center gap-3 py-4 text-center'>
                        <div className='bg-success-soft border-success text-success grid size-14 place-items-center rounded-full border'>
                            <CheckIcon className='size-7' strokeWidth={2.5} />
                        </div>
                        <DialogTitle>{selected === 'lifetime' ? 'Founder Pass unlocked' : "You're on Pro"}</DialogTitle>
                        <DialogDescription className='max-w-[38ch]'>
                            Payment confirmed - your higher limits and power features are active now.
                            {selected === 'lifetime' ? ' No renewals, ever.' : ' Manage it anytime in Settings.'}
                        </DialogDescription>
                        <Button className='mt-2 w-full sm:w-auto' onClick={() => onOpenChange(false)}>
                            Start creating
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-lg'>
                <DialogTitle>{isPaid ? "You're on Pro" : 'Go unlimited'}</DialogTitle>
                <DialogDescription>
                    {isPaid
                        ? 'You already have Pro access. Thanks for supporting LinkedInPreview.'
                        : "You've used today's free AI. Upgrade to keep creating without the daily cap."}
                </DialogDescription>

                {isPaid ? null : selected && !error ? (
                    <div className='flex flex-col gap-3'>
                        <button
                            type='button'
                            onClick={() => setSelected(null)}
                            className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 self-start text-sm'>
                            <ArrowLeftIcon className='size-4' />
                            Back to plans
                        </button>
                        <OnboardingCheckout
                            plan={selected}
                            source='upgrade'
                            onComplete={onComplete}
                            onError={() => setError(true)}
                        />
                    </div>
                ) : (
                    <div className='flex flex-col gap-4'>
                        {error && (
                            <p className='border-border bg-muted/40 text-muted-foreground rounded-lg border px-3 py-2 text-center text-xs'>
                                Checkout is not available right now. Please try again later.
                            </p>
                        )}
                        <div className='flex flex-col gap-3 sm:flex-row'>
                            <div className='border-primary bg-primary/5 relative flex flex-1 flex-col gap-2 rounded-2xl border-2 p-4'>
                                <span className='bg-primary text-primary-foreground absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase'>
                                    Best value
                                </span>
                                <span className='text-muted-foreground text-xs font-medium'>Lifetime</span>
                                <span className='font-heading text-foreground text-2xl tracking-tight'>
                                    {PRICING.lifetime.display}{' '}
                                    <span className='text-muted-foreground text-sm font-normal'>once</span>
                                </span>
                                <p className='text-muted-foreground text-xs'>{AI_METERED_NOTE}.</p>
                                <Button onClick={() => choose('lifetime')} className='mt-auto w-full'>
                                    Get lifetime
                                </Button>
                            </div>
                            <div className='border-border bg-muted/20 flex flex-1 flex-col gap-2 rounded-2xl border p-4'>
                                <span className='text-muted-foreground text-xs font-medium'>Monthly</span>
                                <span className='font-heading text-foreground text-2xl tracking-tight'>
                                    {PRICING.monthly.display}
                                    <span className='text-muted-foreground text-sm font-normal'>/mo</span>
                                </span>
                                <p className='text-muted-foreground text-xs'>Cancel anytime.</p>
                                <Button
                                    variant='secondary'
                                    onClick={() => choose('monthly')}
                                    className='mt-auto w-full'>
                                    Start monthly
                                </Button>
                            </div>
                        </div>
                        <ul className='text-foreground/80 flex flex-col gap-1.5 text-sm'>
                            {[
                                'Higher daily AI limits',
                                'Carousels, calendar & analytics',
                                `${MONEY_BACK_DAYS}-day money-back`,
                            ].map((item) => (
                                <li key={item} className='flex items-center gap-2'>
                                    <CheckIcon className='text-primary size-4 shrink-0' />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className='text-muted-foreground text-center text-xs'>
                            Others charge <span className='line-through'>{COMPETITOR_PRICE_RANGE}</span>.
                        </p>
                        <button
                            type='button'
                            onClick={() => onOpenChange(false)}
                            className='text-muted-foreground hover:text-foreground mx-auto text-xs transition-colors'>
                            Maybe later
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
