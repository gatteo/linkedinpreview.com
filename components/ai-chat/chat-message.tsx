import type { UIMessage } from 'ai'
import { Clock, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'

import { ChatPreviewCard } from './chat-preview-card'
import {
    extractTextFromMessage,
    getRateLimitedReason,
    getRefusalReason,
    isRateLimitedMessage,
    isRefusalMessage,
} from './message-utils'

interface ChatMessageProps {
    message: UIMessage
    isStreaming: boolean
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
    const text = extractTextFromMessage(message)

    if (message.role === 'user') {
        return (
            <div className='flex justify-end'>
                <div
                    className={cn(
                        'bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2 text-sm',
                    )}>
                    {text}
                </div>
            </div>
        )
    }

    if (isRateLimitedMessage(message)) {
        return (
            <div className='w-full'>
                <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                    <div className='flex items-start gap-3'>
                        <Clock className='mt-0.5 size-5 shrink-0 text-blue-600' />
                        <div>
                            <p className='font-medium text-blue-900'>Limit reached</p>
                            <p className='mt-1 text-sm text-blue-700'>{getRateLimitedReason(message)}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (isRefusalMessage(message)) {
        return (
            <div className='w-full'>
                <div className='rounded-lg border border-amber-200 bg-amber-50 p-4'>
                    <div className='flex items-start gap-3'>
                        <TriangleAlert className='mt-0.5 size-5 shrink-0 text-amber-600' />
                        <div>
                            <p className='font-medium text-amber-900'>Unable to generate</p>
                            <p className='mt-1 text-sm text-amber-700'>{getRefusalReason(message)}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='w-full'>
            <ChatPreviewCard text={text} isStreaming={isStreaming} />
        </div>
    )
}
