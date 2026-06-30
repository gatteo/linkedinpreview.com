'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { GaugeIcon, Loader2Icon, RefreshCwIcon, ScissorsIcon, WandSparklesIcon } from 'lucide-react'

import { fallbackPost } from '@/config/onboarding-personalization'
import { computeContentStats } from '@/lib/content-scoring'
import { fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { PostCard } from '@/components/tool/preview/post-card'
import { ScreenSizeProvider } from '@/components/tool/preview/preview-size-context'

import { generateFirstPost, postTextToDoc, refinePost, track } from '../ai'
import { useOnboarding } from '../context'
import { H2, Sub } from '../primitives'

const LENGTH_LABEL: Record<string, string> = {
    optimal: 'Good length',
    too_short: 'A bit short',
    too_long: 'A bit long',
}

export function PreviewStep() {
    const { answers, update, role } = useOnboarding()
    const [generating, setGenerating] = React.useState(false)
    const [busy, setBusy] = React.useState(false)
    const startedRef = React.useRef(false)
    // Latest post text, so a failed regenerate keeps the current post instead of
    // silently swapping it for a canned fallback.
    const textRef = React.useRef('')
    textRef.current = answers.firstPostText ?? ''

    const runGenerate = React.useCallback(async () => {
        setGenerating(true)
        const text = await generateFirstPost({
            role: answers.role || role,
            niche: answers.niche,
            primaryGoal: answers.primaryGoal,
            audience: answers.audience,
            tone: answers.tone,
            name: answers.profile.name || undefined,
        })
        update({ firstPostText: text ?? (textRef.current || fallbackPost(answers.role, answers.niche)) })
        setGenerating(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [answers.role, answers.niche, answers.primaryGoal, answers.audience, answers.tone, answers.profile.name])

    React.useEffect(() => {
        if (startedRef.current) return
        startedRef.current = true
        track('onb_preview_view')
        if (!answers.firstPostText) runGenerate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const regenerate = () => {
        track('onb_preview_regenerate')
        runGenerate()
    }

    const refine = async (action: 'shorten' | 'variation') => {
        if (!answers.firstPostText) return
        setBusy(true)
        const result = await refinePost(action, answers.firstPostText)
        if (result) update({ firstPostText: result })
        setBusy(false)
    }

    const text = answers.firstPostText ?? ''
    const loading = generating && !text

    if (loading) {
        return (
            <div className='flex flex-col items-center gap-5 py-10'>
                <Loader2Icon className='text-primary size-8 animate-spin' />
                <p className='text-foreground font-heading text-lg tracking-tight'>Writing your first post...</p>
                <Sub>Built around your goal and niche.</Sub>
            </div>
        )
    }

    const stats = computeContentStats(text)

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-4'>
            <motion.div variants={staggerItem} className='flex flex-col gap-1 text-center'>
                <H2 className='text-xl'>Here&apos;s a first post, built around your goal.</H2>
                <Sub>Built in seconds. Imagine never staring at a blank editor again.</Sub>
            </motion.div>

            <motion.div
                variants={fadeUp}
                className={cn('relative transition-opacity', (busy || generating) && 'opacity-60')}>
                <ScreenSizeProvider initialSize='desktop'>
                    <PostCard
                        content={postTextToDoc(text)}
                        media={null}
                        author={{
                            name: answers.profile.name,
                            headline: answers.profile.headline,
                            avatarUrl: answers.profile.avatarUrl,
                        }}
                    />
                </ScreenSizeProvider>
                {(busy || generating) && (
                    <div className='absolute inset-0 flex items-center justify-center'>
                        <Loader2Icon className='text-primary size-6 animate-spin' />
                    </div>
                )}
            </motion.div>

            <motion.div variants={staggerItem} className='flex flex-wrap items-center justify-center gap-2'>
                <ActionButton
                    icon={RefreshCwIcon}
                    label='Regenerate'
                    onClick={regenerate}
                    disabled={busy || generating}
                />
                <ActionButton
                    icon={ScissorsIcon}
                    label='Shorter'
                    onClick={() => refine('shorten')}
                    disabled={busy || generating}
                />
                <ActionButton
                    icon={WandSparklesIcon}
                    label='Punchier'
                    onClick={() => refine('variation')}
                    disabled={busy || generating}
                />
                <span className='border-border bg-muted/40 text-muted-foreground ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs'>
                    <GaugeIcon className='size-3.5' />
                    {stats.readabilityLabel} · {LENGTH_LABEL[stats.lengthStatus] ?? `${stats.wordCount} words`}
                </span>
            </motion.div>

            <p className='text-muted-foreground text-center text-xs'>
                You&apos;ll be able to edit, schedule, and publish posts like this in a minute.
            </p>
        </motion.div>
    )
}

function ActionButton({
    icon: Icon,
    label,
    onClick,
    disabled,
}: {
    icon: typeof RefreshCwIcon
    label: string
    onClick: () => void
    disabled?: boolean
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            disabled={disabled}
            className='border-border bg-background text-foreground hover:bg-muted/50 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:pointer-events-none disabled:opacity-50'>
            <Icon className='size-3.5' />
            {label}
        </button>
    )
}
