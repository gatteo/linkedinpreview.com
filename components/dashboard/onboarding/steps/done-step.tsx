'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Loader2Icon } from 'lucide-react'

import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { Button } from '@/components/ui/button'
import { SetupComplete } from '@/components/dashboard/illustrations'

import { useOnboarding } from '../context'

export function DoneStep() {
    const { converted, complete } = useOnboarding()
    const [submitting, setSubmitting] = React.useState(false)

    return (
        <motion.div
            variants={staggerContainer}
            initial='hidden'
            animate='visible'
            className='flex flex-col items-center gap-5 py-4 text-center'>
            <motion.div variants={fadeUp} className='w-40'>
                <SetupComplete />
            </motion.div>
            <motion.div variants={staggerItem} className='flex flex-col gap-1.5'>
                <h2 className='font-heading text-2xl tracking-tight'>
                    {converted ? 'Welcome to Pro!' : "You're all set."}
                </h2>
                <p className='text-muted-foreground mx-auto max-w-sm text-sm text-pretty'>
                    {converted
                        ? 'Your system is live and your first post is ready to publish.'
                        : 'Your posts are waiting - your first one is ready to publish whenever you are.'}
                </p>
            </motion.div>
            <motion.div variants={staggerItem}>
                <Button
                    size='lg'
                    disabled={submitting}
                    onClick={() => {
                        setSubmitting(true)
                        complete()
                    }}>
                    {submitting && <Loader2Icon className='size-4 animate-spin' />}
                    Open my first post
                </Button>
            </motion.div>
        </motion.div>
    )
}
