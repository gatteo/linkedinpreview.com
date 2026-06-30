import type { UIMessage } from 'ai'
import { Clock, TriangleAlert } from 'lucide-react'

import {
    extractTextFromMessage,
    getRateLimitedReason,
    getRefusalReason,
    isRateLimitedMessage,
    isRefusalMessage,
} from '@/lib/ai-chat'
import { cn } from '@/lib/utils'

import { ChatPreviewCard } from './chat-preview-card'

type ChatMessageProps = {
    message: UIMessage
    isStreaming: boolean
    onOpenInEditor?: () => void
}

export function ChatMessage({ message, isStreaming, onOpenInEditor }: ChatMessageProps) {
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
                <div className='border-info/50 bg-info-soft rounded-lg border p-4'>
                    <div className='flex items-start gap-3'>
                        <Clock className='text-info mt-0.5 size-5 shrink-0' />
                        <div>
                            <p className='text-info font-medium'>Limit reached</p>
                            <p className='text-info mt-1 text-sm'>{getRateLimitedReason(message)}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (isRefusalMessage(message)) {
        return (
            <div className='w-full'>
                <div className='border-warning/50 bg-warning-soft rounded-lg border p-4'>
                    <div className='flex items-start gap-3'>
                        <TriangleAlert className='text-warning mt-0.5 size-5 shrink-0' />
                        <div>
                            <p className='text-warning font-medium'>Unable to generate</p>
                            <p className='text-warning mt-1 text-sm'>{getRefusalReason(message)}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='w-full'>
            <ChatPreviewCard text={text} isStreaming={isStreaming} onOpenInEditor={onOpenInEditor} />
        </div>
    )
}
