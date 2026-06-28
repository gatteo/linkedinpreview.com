'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { QuoteIcon } from 'lucide-react'

import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { track } from '../ai'
import { useOnboarding } from '../context'

export function ProofStep() {
    const { role, roleContent } = useOnboarding()
    const { proof } = roleContent

    React.useEffect(() => {
        track('onb_proof_view', { role })
    }, [role])

    return (
        <motion.div
            variants={staggerContainer}
            initial='hidden'
            animate='visible'
            className='flex flex-col items-center gap-6 py-2 text-center'>
            <motion.div variants={fadeUp} className='flex flex-col items-center gap-1'>
                <span className='font-heading text-primary text-5xl tracking-tight'>{proof.stat}</span>
                <p className='text-foreground mx-auto max-w-md text-pretty'>{proof.claim}</p>
            </motion.div>

            <motion.div
                variants={staggerItem}
                className='border-border bg-muted/30 flex w-full max-w-md flex-col gap-3 rounded-2xl border p-5 text-left'>
                <QuoteIcon className='text-primary/40 size-6' />
                <p className='text-foreground text-sm leading-relaxed text-pretty'>{proof.testimonial.quote}</p>
                <div className='flex items-center gap-3'>
                    <Avatar className='size-9'>
                        <AvatarFallback>{proof.testimonial.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col'>
                        <span className='text-foreground text-sm font-semibold'>{proof.testimonial.name}</span>
                        <span className='text-muted-foreground text-xs'>{proof.testimonial.title}</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
