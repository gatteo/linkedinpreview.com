'use client'

// ---------------------------------------------------------------------------
// <EmptyState> — one reusable component so every empty surface in the dashboard
// reads consistently: an illustration, a confident headline, supporting copy,
// and a primary (optionally secondary) action. Content fades/scales in on mount;
// reduced motion is honored via the shared motion tokens + MotionConfig.
// ---------------------------------------------------------------------------
import * as React from 'react'
import { motion } from 'framer-motion'

import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
    illustration?: React.ReactNode
    title: string
    description?: string
    action?: React.ReactNode
    secondaryAction?: React.ReactNode
    className?: string
    /** Tighter spacing + smaller copy for sidebar-scale surfaces. */
    compact?: boolean
}

export function EmptyState({
    illustration,
    title,
    description,
    action,
    secondaryAction,
    className,
    compact = false,
}: EmptyStateProps) {
    return (
        <motion.div
            variants={staggerContainer}
            initial='hidden'
            animate='visible'
            className={cn(
                'flex flex-col items-center justify-center text-center',
                compact ? 'gap-2 px-4 py-6' : 'gap-4 px-6 py-10',
                className,
            )}>
            {illustration && (
                <motion.div variants={fadeUp} className={cn('text-muted-foreground/70', compact ? 'w-28' : 'w-40')}>
                    {illustration}
                </motion.div>
            )}
            <motion.div variants={staggerItem} className='flex flex-col gap-1'>
                <h3 className={cn('text-foreground font-medium', compact ? 'text-sm' : 'text-base')}>{title}</h3>
                {description && (
                    <p
                        className={cn(
                            'text-muted-foreground mx-auto max-w-sm text-balance',
                            compact ? 'text-xs' : 'text-sm',
                        )}>
                        {description}
                    </p>
                )}
            </motion.div>
            {(action || secondaryAction) && (
                <motion.div variants={staggerItem} className='mt-1 flex flex-wrap items-center justify-center gap-2'>
                    {action}
                    {secondaryAction}
                </motion.div>
            )}
        </motion.div>
    )
}
