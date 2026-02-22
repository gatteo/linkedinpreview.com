'use client'

import React from 'react'
import type { UIMessage } from 'ai'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

import { ChatInput } from './chat-input'
import { ChatMessage } from './chat-message'
import { SuggestionChips } from './suggestion-chips'

interface ChatPhaseProps {
    messages: UIMessage[]
    status: 'ready' | 'submitted' | 'streaming' | 'error'
    onSendMessage: (text: string) => void
    onStop: () => void
    onOpenInEditor: () => void
    latestPostText: string
    suggestions: string[]
    suggestionsLoading: boolean
    onSuggestionSelect: (text: string) => void
}

export function ChatPhase({
    messages,
    status,
    onSendMessage,
    onStop,
    onOpenInEditor,
    latestPostText,
    suggestions,
    suggestionsLoading,
    onSuggestionSelect,
}: ChatPhaseProps) {
    const bottomRef = React.useRef<HTMLDivElement>(null)
    const isLoading = status === 'submitted' || status === 'streaming'

    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, latestPostText])

    return (
        <div className='flex min-h-0 flex-1 flex-col'>
            <ScrollArea className='flex-1'>
                <div className='flex flex-col gap-4 px-6 py-4'>
                    {messages.map((message, index) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            isStreaming={isLoading && message.role === 'assistant' && index === messages.length - 1}
                        />
                    ))}
                    {!isLoading && (suggestionsLoading || suggestions.length > 0) && (
                        <SuggestionChips
                            suggestions={suggestions}
                            loading={suggestionsLoading}
                            onSelect={onSuggestionSelect}
                        />
                    )}
                    <div ref={bottomRef} />
                </div>
            </ScrollArea>

            {!isLoading && latestPostText && (
                <div className='border-t px-6 py-3'>
                    <Button onClick={onOpenInEditor} className='w-full'>
                        Open in Editor
                    </Button>
                </div>
            )}

            <ChatInput onSend={onSendMessage} isLoading={isLoading} onStop={onStop} />
        </div>
    )
}
