'use client'

import React from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { LucideIcon } from 'lucide-react'
import { BookOpen, Briefcase, Clock, Coffee, Heart, Laugh, MessageCircle, Sparkles, TriangleAlert } from 'lucide-react'
import posthog from 'posthog-js'

import { Tone, TONE_OPTIONS } from '@/config/ai'
import { ApiRoutes } from '@/config/routes'
import { formatResetTime, isRateLimitError, parseAIError } from '@/lib/ai-error'
import { toTipTapParagraphs } from '@/lib/parse-formatted-text'
import { cn } from '@/lib/utils'
import { useAnonymousAuth } from '@/hooks/use-anonymous-auth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { extractTextFromMessage, getRefusalReason, REFUSAL_PREFIX } from '@/components/ai-chat/message-utils'
import { Tool } from '@/components/tool/tool'

const TONE_ICONS: Record<Tone, LucideIcon> = {
    professional: Briefcase,
    casual: Coffee,
    inspirational: Heart,
    educational: BookOpen,
    storytelling: MessageCircle,
    humorous: Laugh,
}

type InlineError = { variant: 'rate' | 'error'; message: string }

export function GeneratorTool() {
    const [topic, setTopic] = React.useState('')
    const [tone, setTone] = React.useState<Tone>('professional')
    const [doc, setDoc] = React.useState<any>(undefined)
    const [error, setError] = React.useState<InlineError | null>(null)
    const [refusalReason, setRefusalReason] = React.useState<string | null>(null)
    const { ensureSession } = useAnonymousAuth()

    // Ref to avoid a stale tone in the useChat callbacks
    const toneRef = React.useRef(tone)
    React.useEffect(() => {
        toneRef.current = tone
    }, [tone])

    const transport = React.useMemo(() => new DefaultChatTransport({ api: ApiRoutes.Chat }), [])

    const { messages, sendMessage, status } = useChat({
        transport,
        onFinish: ({ message }) => {
            const text = extractTextFromMessage(message)

            // The model refuses off-topic requests with a [REFUSED] prefix - surface
            // the reason and do not inject anything into the preview.
            if (text.startsWith(REFUSAL_PREFIX)) {
                setRefusalReason(getRefusalReason(message))
                return
            }

            posthog?.capture('ai_generation_completed', {
                output_length: text.length,
                tone: toneRef.current,
                surface: 'generator_page',
            })

            // A fresh doc object on every generation re-fires the EditorPanel effect.
            setDoc({ type: 'doc', content: toTipTapParagraphs(text) })

            requestAnimationFrame(() => {
                document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' })
            })
        },
        onError: (err) => {
            const aiError = parseAIError(err)

            if (isRateLimitError(aiError)) {
                const timeStr = formatResetTime(aiError.resetAt)
                posthog?.capture('ai_rate_limited', {
                    action: aiError.action,
                    reset_at: aiError.resetAt,
                    surface: 'generator_page',
                })
                setError({ variant: 'rate', message: `You've reached the limit. Try again in ${timeStr}.` })
                return
            }

            if (aiError?.code === 'AUTH_REQUIRED') {
                ensureSession()
                setError({ variant: 'error', message: 'Your session expired. Please try generating again.' })
                return
            }

            posthog?.captureException(err)
            setError({ variant: 'error', message: 'Something went wrong generating your post. Please try again.' })
        },
    })

    const isGenerating = status === 'submitted' || status === 'streaming'

    const latestAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    const streamingText = latestAssistant ? extractTextFromMessage(latestAssistant) : ''
    const showStreaming = isGenerating && streamingText.length > 0 && !streamingText.startsWith(REFUSAL_PREFIX)

    const handleGenerate = React.useCallback(async () => {
        if (!topic.trim() || isGenerating) return
        setError(null)
        setRefusalReason(null)
        await ensureSession()
        const prompt = `Write a LinkedIn post about: ${topic}\n\nTone: ${tone}`
        posthog?.capture('ai_generation_started', {
            tone,
            topic_length: topic.length,
            surface: 'generator_page',
        })
        sendMessage({ text: prompt })
    }, [topic, tone, isGenerating, ensureSession, sendMessage])

    return (
        <>
            <section className='border-border border-t px-6 py-12 md:py-16'>
                <div className='mx-auto flex max-w-2xl flex-col gap-5'>
                    <div className='flex flex-col gap-2'>
                        <label htmlFor='generator-topic' className='text-sm font-medium text-neutral-900'>
                            What do you want to post about?
                        </label>
                        <Textarea
                            id='generator-topic'
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder='Describe your topic, paste a rough draft, or share an idea...'
                            rows={4}
                            maxLength={2000}
                            disabled={isGenerating}
                        />
                    </div>

                    <div className='flex flex-col gap-2'>
                        <p className='text-sm font-medium text-neutral-900'>Choose a tone</p>
                        <div className='flex flex-wrap gap-1.5' role='radiogroup' aria-label='Tone'>
                            {TONE_OPTIONS.map((option) => {
                                const Icon = TONE_ICONS[option.value]
                                const selected = tone === option.value
                                return (
                                    <button
                                        key={option.value}
                                        type='button'
                                        role='radio'
                                        aria-checked={selected}
                                        disabled={isGenerating}
                                        onClick={() => setTone(option.value)}
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50',
                                            selected
                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-transparent',
                                        )}>
                                        <Icon className='size-3.5' />
                                        {option.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={!topic.trim() || isGenerating}
                        size='lg'
                        className='w-full gap-2'>
                        <Sparkles className='size-4' />
                        {isGenerating ? 'Generating...' : 'Generate Post'}
                    </Button>

                    {showStreaming && (
                        <div className='border-border rounded-lg border bg-neutral-50 p-4'>
                            <div className='text-muted-foreground mb-2 flex items-center gap-2 text-xs font-medium'>
                                <Sparkles className='text-primary size-3.5 animate-pulse' />
                                Generating your post...
                            </div>
                            <p className='text-sm leading-relaxed whitespace-pre-wrap text-neutral-700'>
                                {streamingText}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div
                            role='alert'
                            className={cn(
                                'flex items-start gap-3 rounded-lg border p-4',
                                error.variant === 'rate' ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50',
                            )}>
                            {error.variant === 'rate' ? (
                                <Clock className='mt-0.5 size-5 shrink-0 text-blue-600' />
                            ) : (
                                <TriangleAlert className='mt-0.5 size-5 shrink-0 text-red-600' />
                            )}
                            <p className={cn('text-sm', error.variant === 'rate' ? 'text-blue-700' : 'text-red-700')}>
                                {error.message}
                            </p>
                        </div>
                    )}

                    {refusalReason && (
                        <div
                            role='alert'
                            className='flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4'>
                            <TriangleAlert className='mt-0.5 size-5 shrink-0 text-amber-600' />
                            <div>
                                <p className='font-medium text-amber-900'>Unable to generate</p>
                                <p className='mt-1 text-sm text-amber-700'>{refusalReason}</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <Tool injectedDoc={doc} />
        </>
    )
}
