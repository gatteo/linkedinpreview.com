'use client'

import * as React from 'react'
import { ArrowLeftIcon, CheckIcon } from 'lucide-react'
import { toast } from 'sonner'

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
}

export function UpgradeDialog({ open, onOpenChange, reason }: UpgradeDialogProps) {
    const { isPaid, refresh } = usePlan()
    const [selected, setSelected] = React.useState<CheckoutPlan | null>(null)
    const [error, setError] = React.useState(false)

    React.useEffect(() => {
        if (open) {
            setSelected(null)
            setError(false)
            track('upgrade_prompt_view', { reason })
        }
    }, [open, reason])

    const choose = (plan: CheckoutPlan) => {
        track('upgrade_select', { plan, reason })
        setError(false)
        setSelected(plan)
    }

    const onComplete = () => {
        track('upgrade_success', { plan: selected, reason })
        refresh()
        toast.success("You're on Pro - enjoy the higher limits.")
        onOpenChange(false)
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
                        <OnboardingCheckout plan={selected} onComplete={onComplete} onError={() => setError(true)} />
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
