'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, CheckIcon, ClockIcon, ShieldCheckIcon } from 'lucide-react'

import { cadenceOption, goalRestated, postsPerMonth } from '@/config/onboarding-personalization'
import {
    AI_METERED_NOTE,
    COMPETITOR_PRICE_RANGE,
    FOUNDING_WINDOW_END,
    isFoundingWindowOpen,
    MONEY_BACK_DAYS,
    PRICING,
    type CheckoutPlan,
} from '@/config/pricing'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { usePlan } from '@/hooks/use-plan'
import { Button } from '@/components/ui/button'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { firstName, H2, Sub } from '../primitives'
import { OnboardingCheckout } from './checkout'

function foundingDate() {
    try {
        return new Date(FOUNDING_WINDOW_END).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
    } catch {
        return ''
    }
}

export function OfferStep() {
    const { answers, finishOffer } = useOnboarding()
    const { refresh } = usePlan()
    const [selected, setSelected] = React.useState<CheckoutPlan | null>(null)
    const [error, setError] = React.useState(false)
    const founding = isFoundingWindowOpen()
    const ideasCount = postsPerMonth(cadenceOption(answers.cadence).frequency)
    const fn = firstName(answers.profile.name)

    React.useEffect(() => {
        track('onb_offer_view')
    }, [])

    const choose = (plan: CheckoutPlan) => {
        track('onb_offer_select', { plan })
        setError(false)
        setSelected(plan)
    }

    const onComplete = () => {
        track('onb_purchase_success', { plan: selected })
        refresh()
        finishOffer(true)
    }

    const decline = () => {
        track('onb_offer_decline')
        finishOffer(false)
    }

    if (selected && !error) {
        return (
            <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-4'>
                <button
                    type='button'
                    onClick={() => setSelected(null)}
                    className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 self-start text-sm'>
                    <ArrowLeftIcon className='size-4' />
                    Back to plans
                </button>
                <OnboardingCheckout plan={selected} onComplete={onComplete} onError={() => setError(true)} />
                <button
                    type='button'
                    onClick={decline}
                    className='text-muted-foreground hover:text-foreground mx-auto text-xs transition-colors'>
                    Continue on the free plan
                </button>
            </motion.div>
        )
    }

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-[18px]'>
            <motion.div variants={fadeUp} className='text-center'>
                <H2>{fn ? `${fn}, keep the system you just built.` : 'Keep the system you just built.'}</H2>
                <Sub className='mx-auto mt-1.5 max-w-[440px]'>
                    Everything to {goalRestated(answers.primaryGoal)} - for less than a coffee a month.
                </Sub>
            </motion.div>

            {error && (
                <motion.p
                    variants={staggerItem}
                    className='border-border bg-muted/40 text-muted-foreground rounded-lg border px-3 py-2 text-center text-xs'>
                    Checkout is not available right now. You can continue on the free plan and upgrade later.
                </motion.p>
            )}

            <motion.div variants={staggerItem} className='flex flex-col gap-3 sm:flex-row'>
                {/* Lifetime - hero */}
                <div
                    style={{ background: 'color-mix(in oklch, var(--primary) 6%, var(--card))' }}
                    className='border-primary relative flex flex-1 flex-col gap-3 rounded-[18px] border-2 p-[18px]'>
                    <span className='bg-primary text-primary-foreground absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase'>
                        Best value
                    </span>
                    <div className='flex flex-col'>
                        <span className='text-muted-foreground text-xs font-medium'>Lifetime</span>
                        <span className='font-heading text-foreground text-3xl leading-tight font-bold tracking-tight'>
                            {PRICING.lifetime.display}
                        </span>
                        <span className='text-muted-foreground text-xs'>once {founding && '· founding price'}</span>
                    </div>
                    <p className='text-foreground text-[13.5px]'>Pay once. Keep all power features forever.</p>
                    <p className='text-muted-foreground text-xs'>{AI_METERED_NOTE}.</p>
                    <Button onClick={() => choose('lifetime')} className='mt-auto h-10 w-full'>
                        Get lifetime
                    </Button>
                </div>

                {/* Monthly - foil */}
                <div className='border-border bg-muted/20 flex flex-1 flex-col gap-3 rounded-[18px] border p-[18px]'>
                    <div className='flex flex-col'>
                        <span className='text-muted-foreground text-xs font-medium'>Monthly</span>
                        <span className='font-heading text-foreground text-3xl leading-tight font-bold tracking-tight'>
                            {PRICING.monthly.display}
                            <span className='text-muted-foreground text-base font-normal'>/mo</span>
                        </span>
                        <span className='text-muted-foreground text-xs'>cancel anytime</span>
                    </div>
                    <p className='text-foreground text-[13.5px]'>All Pro features, billed monthly.</p>
                    <p className='text-muted-foreground text-xs'>
                        Renews at {PRICING.monthly.display}/mo until cancelled.
                    </p>
                    <Button variant='secondary' onClick={() => choose('monthly')} className='mt-auto h-10 w-full'>
                        Start monthly
                    </Button>
                </div>
            </motion.div>

            <motion.p variants={staggerItem} className='text-muted-foreground text-center text-xs'>
                Others charge <span className='line-through'>{COMPETITOR_PRICE_RANGE}</span>. You:{' '}
                <span className='text-foreground font-semibold'>{PRICING.lifetime.display} once.</span>
            </motion.p>

            <motion.ul
                variants={staggerItem}
                className='mx-auto grid max-w-[430px] grid-cols-1 gap-x-4 gap-y-[7px] sm:grid-cols-2'>
                {[
                    'Your positioning, voice & first post',
                    `${ideasCount} posts a month planned`,
                    'Carousels',
                    'Calendar & scheduling',
                    'Higher AI limits',
                    'Analytics',
                ].map((item) => (
                    <li key={item} className='text-foreground/85 flex items-center gap-2 text-[13.5px]'>
                        <CheckIcon className='text-primary size-[15px] shrink-0' />
                        {item}
                    </li>
                ))}
            </motion.ul>

            <motion.div variants={staggerItem} className='flex flex-col items-center gap-1.5'>
                {founding && (
                    <p className='text-foreground flex items-center gap-1.5 text-[12.5px] font-medium'>
                        <ClockIcon className='size-3.5' />
                        Founding price ends {foundingDate()}.
                    </p>
                )}
                <p className='text-muted-foreground flex items-center gap-1.5 text-[12.5px]'>
                    <ShieldCheckIcon className='size-3.5' />
                    {MONEY_BACK_DAYS}-day money-back. Cancel in two clicks.
                </p>
            </motion.div>

            <motion.button
                variants={staggerItem}
                type='button'
                onClick={decline}
                className='text-muted-foreground hover:text-foreground mx-auto text-[12.5px] transition-colors'>
                Continue on the free plan
            </motion.button>
        </motion.div>
    )
}
