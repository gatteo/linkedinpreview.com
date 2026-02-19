'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type Stage = 'ask' | 'negative-form' | 'thanks'

export function CopyFeedback({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
    const [stage, setStage] = useState<Stage>('ask')
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const dismiss = useCallback(() => {
        setStage('ask')
        setComment('')
        onDismiss()
    }, [onDismiss])

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    // Auto-dismiss after 10s
    useEffect(() => {
        if (!visible) return
        clearTimer()
        timerRef.current = setTimeout(dismiss, 10_000)
        return clearTimer
    }, [visible, dismiss, clearTimer])

    // Reset stage when widget becomes visible
    useEffect(() => {
        if (visible) {
            setStage('ask')
            setComment('')
        }
    }, [visible])

    const sendFeedback = async (rating: 'positive' | 'negative', feedbackComment?: string) => {
        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating,
                    comment: feedbackComment,
                    timestamp: new Date().toISOString(),
                }),
            })
        } catch {
            // silently fail — feedback is non-critical
        }
    }

    const handlePositive = () => {
        clearTimer()
        sendFeedback('positive')
        setStage('thanks')
        setTimeout(dismiss, 1500)
    }

    const handleNegative = () => {
        clearTimer()
        setStage('negative-form')
        // Restart auto-dismiss with longer timeout for form
        timerRef.current = setTimeout(dismiss, 30_000)
    }

    const handleSubmitNegative = async () => {
        if (submitting) return
        setSubmitting(true)
        clearTimer()
        await sendFeedback('negative', comment || undefined)
        setSubmitting(false)
        setStage('thanks')
        setTimeout(dismiss, 1500)
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className='fixed bottom-4 right-4 z-50 w-72 rounded-lg border border-border bg-card p-4 shadow-lg sm:w-80'>
                    {/* Close button */}
                    <button
                        onClick={dismiss}
                        className='absolute right-2 top-2 text-muted-foreground transition-colors hover:text-foreground'
                        aria-label='Dismiss'>
                        <svg width='14' height='14' viewBox='0 0 14 14' fill='none'>
                            <path
                                d='M1 1l12 12M13 1L1 13'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                            />
                        </svg>
                    </button>

                    {stage === 'ask' && (
                        <div className='flex flex-col items-center gap-3'>
                            <p className='text-sm font-medium text-card-foreground'>Was this helpful?</p>
                            <div className='flex gap-3'>
                                <button
                                    onClick={handlePositive}
                                    className='rounded-md px-4 py-1.5 text-lg transition-colors hover:bg-accent'
                                    aria-label='Helpful'>
                                    👍
                                </button>
                                <button
                                    onClick={handleNegative}
                                    className='rounded-md px-4 py-1.5 text-lg transition-colors hover:bg-accent'
                                    aria-label='Not helpful'>
                                    👎
                                </button>
                            </div>
                        </div>
                    )}

                    {stage === 'negative-form' && (
                        <div className='flex flex-col gap-3'>
                            <p className='text-sm font-medium text-card-foreground'>What could be better?</p>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder='Your feedback...'
                                rows={3}
                                className='w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                            />
                            <button
                                onClick={handleSubmitNegative}
                                disabled={submitting}
                                className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'>
                                {submitting ? 'Sending...' : 'Submit'}
                            </button>
                        </div>
                    )}

                    {stage === 'thanks' && (
                        <div className='flex items-center justify-center py-1'>
                            <p className='text-sm font-medium text-card-foreground'>
                                {comment ? 'Thanks for the feedback!' : 'Thanks! 🎉'}
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
