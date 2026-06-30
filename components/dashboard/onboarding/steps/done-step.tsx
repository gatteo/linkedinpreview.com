'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon, CheckIcon, Loader2Icon, RocketIcon } from 'lucide-react'

import { popIn, staggerContainer, staggerItem } from '@/lib/motion'
import { usePlan } from '@/hooks/use-plan'
import { Button } from '@/components/ui/button'

import { useOnboarding } from '../context'
import { H2, Sub } from '../primitives'

export function DoneStep() {
    const { converted, complete } = useOnboarding()
    const { isPaid } = usePlan()
    const [submitting, setSubmitting] = React.useState(false)

    // The Stripe webhook may not have landed yet (PlanProvider.refresh re-polls).
    // Don't claim "Welcome to Pro!" until the plan is actually confirmed paid.
    const confirmingUpgrade = converted && !isPaid

    return (
        <motion.div
            variants={staggerContainer}
            initial='hidden'
            animate='visible'
            className='flex flex-col items-center gap-[22px] py-4 text-center'>
            <motion.div
                variants={popIn}
                style={{
                    background:
                        'linear-gradient(150deg, color-mix(in oklch, var(--primary) 18%, transparent), color-mix(in oklch, var(--primary) 5%, transparent))',
                }}
                className='text-primary flex size-[72px] items-center justify-center rounded-[22px]'>
                {converted ? <RocketIcon className='size-8' /> : <CheckIcon className='size-8' />}
            </motion.div>
            <motion.div variants={staggerItem} className='flex flex-col gap-1.5'>
                <H2 className='text-[26px]'>
                    {confirmingUpgrade
                        ? 'Finishing your upgrade...'
                        : converted
                          ? 'Welcome to Pro!'
                          : "You're all set."}
                </H2>
                <Sub className='mx-auto max-w-[360px]'>
                    {confirmingUpgrade
                        ? 'Payment received - your Pro features are unlocking now. Your first post is ready.'
                        : converted
                          ? 'Your system is live and your first post is ready to publish.'
                          : 'Your posts are waiting - your first one is ready to publish whenever you are.'}
                </Sub>
            </motion.div>
            <motion.div variants={staggerItem}>
                <Button
                    size='lg'
                    disabled={submitting}
                    className='h-[46px] px-[22px] text-[15px]'
                    onClick={() => {
                        setSubmitting(true)
                        complete()
                    }}>
                    {submitting && <Loader2Icon className='size-4 animate-spin' />}
                    Open my first post
                    <ArrowRightIcon className='size-4' />
                </Button>
            </motion.div>
        </motion.div>
    )
}
