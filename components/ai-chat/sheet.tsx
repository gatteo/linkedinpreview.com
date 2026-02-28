'use client'

import React from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import posthog from 'posthog-js'
import { toast } from 'sonner'

import { Tone } from '@/config/ai'
import { ApiRoutes } from '@/config/routes'
import { formatResetTime, isRateLimitError, parseAIError } from '@/lib/ai-error'
import { fetchSuggestions } from '@/lib/ai-suggestions'
import { useAnonymousAuth } from '@/hooks/use-anonymous-auth'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

import { ChatPhase } from './chat-phase'
import { ConfigPhase } from './config-phase'
import {
    extractTextFromMessage,
    isRateLimitedMessage,
    isRefusalMessage,
    RATE_LIMITED_PREFIX,
    REFUSAL_PREFIX,
} from './message-utils'

interface AIGenerateSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onInsert: (text: string) => void
}

export function AIGenerateSheet({ open, onOpenChange, onInsert }: AIGenerateSheetProps) {
    const isMobile = useIsMobile()
    const [phase, setPhase] = React.useState<'config' | 'chat'>('config')
    const [topic, setTopic] = React.useState('')
    const [tone, setTone] = React.useState<Tone>('professional')
    const [suggestions, setSuggestions] = React.useState<string[]>([])
    const [suggestionsLoading, setSuggestionsLoading] = React.useState(false)
    const { isAuthReady, ensureSession } = useAnonymousAuth()

    // Refs to avoid stale closures in useChat callbacks
    const toneRef = React.useRef(tone)
    React.useEffect(() => {
        toneRef.current = tone
    }, [tone])

    const transport = React.useMemo(() => new DefaultChatTransport({ api: ApiRoutes.Chat }), [])

    const { messages, sendMessage, status, stop, setMessages } = useChat({
        transport,
        onFinish: ({ message, messages: allMessages }) => {
            const text = extractTextFromMessage(message)
            posthog.capture('ai_generation_completed', {
                output_length: text.length,
                tone: toneRef.current,
                message_count: allMessages.length,
            })
            if (!text.startsWith(REFUSAL_PREFIX)) {
                setSuggestionsLoading(true)
                fetchSuggestions(text)
                    .then((s) => {
                        setSuggestions(s)
                        if (s.length > 0) {
                            posthog.capture('ai_suggestions_loaded', { suggestions: s })
                        } else {
                            posthog.capture('ai_suggestions_failed')
                        }
                    })
                    .finally(() => setSuggestionsLoading(false))
            }
        },
        onError: (err) => {
            const aiError = parseAIError(err)

            if (isRateLimitError(aiError)) {
                const timeStr = formatResetTime(aiError.resetAt)
                const label = aiError.action === 'generation' ? 'generation' : 'refinement'
                posthog.capture('ai_rate_limited', { action: aiError.action, reset_at: aiError.resetAt })

                // Inject a synthetic assistant message so the limit shows in the chat
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `rate-limit-${Date.now()}`,
                        role: 'assistant' as const,
                        parts: [
                            {
                                type: 'text' as const,
                                text: `${RATE_LIMITED_PREFIX} You've reached your daily ${label} limit. Try again in ${timeStr}.`,
                            },
                        ],
                        createdAt: new Date(),
                    },
                ])
                return
            }

            if (aiError?.code === 'AUTH_REQUIRED') {
                toast.error('Session expired. Please try again.')
                ensureSession()
                setPhase('config')
                setMessages([])
                return
            }

            posthog.captureException(err)
            toast.error('Failed to generate post. Please try again.')
            // Revert to config phase so the user isn't stuck in an empty chat
            setPhase('config')
        },
    })

    // Lazy anonymous auth + track sheet open/close
    React.useEffect(() => {
        if (open) {
            ensureSession()
            posthog.capture('ai_sheet_opened')
        }
    }, [open, ensureSession])

    const latestAssistantMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'assistant' && !isRefusalMessage(m) && !isRateLimitedMessage(m))
    const latestPostText = latestAssistantMessage ? extractTextFromMessage(latestAssistantMessage) : ''

    const handleGenerate = React.useCallback(async () => {
        await ensureSession()
        setSuggestions([])
        setSuggestionsLoading(false)
        const prompt = `Write a LinkedIn post about: ${topic}\n\nTone: ${tone}`
        posthog.capture('ai_generation_started', { tone, topic_length: topic.length })
        sendMessage({ text: prompt })
        setPhase('chat')
    }, [topic, tone, sendMessage, ensureSession])

    const handleSendRefinement = React.useCallback(
        async (text: string) => {
            await ensureSession()
            setSuggestions([])
            setSuggestionsLoading(false)
            posthog.capture('ai_chat_refinement_sent', {
                message_count: messages.length,
                refinement_length: text.length,
            })
            sendMessage({ text })
        },
        [messages.length, sendMessage, ensureSession],
    )

    const handleSuggestionSelect = React.useCallback(
        (text: string) => {
            posthog.capture('ai_suggestion_clicked', { suggestion: text })
            handleSendRefinement(text)
        },
        [handleSendRefinement],
    )

    const handleOpenInEditor = React.useCallback(() => {
        if (!latestPostText) return
        posthog.capture('ai_generation_inserted', { message_count: messages.length })
        onInsert(latestPostText)
        onOpenChange(false)
    }, [latestPostText, messages.length, onInsert, onOpenChange])

    const handleReset = React.useCallback(() => {
        posthog.capture('ai_post_reset', { message_count: messages.length })
        stop()
        setMessages([])
        setSuggestions([])
        setSuggestionsLoading(false)
        setTopic('')
        setTone('professional')
        setPhase('config')
    }, [stop, setMessages, messages.length])

    const handleOpenChange = React.useCallback(
        (newOpen: boolean) => {
            if (!newOpen) {
                stop()
                posthog.capture('ai_sheet_closed', { phase, message_count: messages.length })
            }
            onOpenChange(newOpen)
        },
        [stop, onOpenChange, phase, messages.length],
    )

    const isLoading = !isAuthReady || status === 'submitted' || status === 'streaming'

    const configHeader = isMobile ? (
        <>
            <DrawerTitle className='sr-only'>Generate with AI</DrawerTitle>
            <DrawerDescription className='sr-only'>
                Choose a topic and tone, then generate your LinkedIn post.
            </DrawerDescription>
        </>
    ) : (
        <>
            <SheetTitle className='sr-only'>Generate with AI</SheetTitle>
            <SheetDescription className='sr-only'>
                Choose a topic and tone, then generate your LinkedIn post.
            </SheetDescription>
        </>
    )

    const chatHeaderContent = (Title: React.ElementType, Description: React.ElementType) => (
        <div className='border-border flex items-center gap-3 border-b px-4 py-3 pr-12'>
            <div className='min-w-0 flex-1'>
                <Title className='text-sm font-medium'>AI Assistant</Title>
                <Description className='text-muted-foreground text-xs'>Refine and perfect your post</Description>
            </div>
            <Button variant='outline' size='sm' className='h-7 shrink-0 px-2.5 text-xs' onClick={handleReset}>
                New post
            </Button>
        </div>
    )

    const chatHeader = isMobile
        ? chatHeaderContent(DrawerTitle, DrawerDescription)
        : chatHeaderContent(SheetTitle, SheetDescription)

    const header = phase === 'config' ? configHeader : chatHeader

    const body =
        phase === 'config' ? (
            <ConfigPhase
                topic={topic}
                onTopicChange={setTopic}
                tone={tone}
                onToneChange={setTone}
                onGenerate={handleGenerate}
                isLoading={isLoading}
            />
        ) : (
            <ChatPhase
                messages={messages}
                status={status}
                onSendMessage={handleSendRefinement}
                onStop={stop}
                onOpenInEditor={handleOpenInEditor}
                latestPostText={latestPostText}
                suggestions={suggestions}
                suggestionsLoading={suggestionsLoading}
                onSuggestionSelect={handleSuggestionSelect}
            />
        )

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={handleOpenChange}>
                <DrawerContent>
                    {phase === 'config' ? (
                        <>
                            {header}
                            <div className='h-[90vh] overflow-y-auto pb-6'>{body}</div>
                        </>
                    ) : (
                        <>
                            {header}
                            <div className='flex h-[70vh] flex-col overflow-hidden'>{body}</div>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent className='flex flex-col gap-0 overflow-hidden data-[side=right]:sm:max-w-2xl'>
                {phase === 'config' ? (
                    <>
                        {header}
                        <div className='flex min-h-0 flex-1 flex-col overflow-y-auto'>{body}</div>
                    </>
                ) : (
                    <>
                        {header}
                        {body}
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
