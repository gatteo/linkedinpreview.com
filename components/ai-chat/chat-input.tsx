'use client'

import React from 'react'
import { ArrowUp, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ChatInputProps {
    onSend: (text: string) => void
    isLoading: boolean
    onStop: () => void
}

export function ChatInput({ onSend, isLoading, onStop }: ChatInputProps) {
    const [value, setValue] = React.useState('')
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    const handleSend = React.useCallback(() => {
        const trimmed = value.trim()
        if (!trimmed || isLoading) return
        onSend(trimmed)
        setValue('')
        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }, [value, isLoading, onSend])

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
            }
        },
        [handleSend],
    )

    const handleInput = React.useCallback(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        const lineHeight = Number.parseInt(window.getComputedStyle(el).lineHeight) || 20
        const maxHeight = lineHeight * 4
        el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    }, [])

    return (
        <div className='flex items-end gap-2 border-t border-border px-4 py-3'>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value)
                    handleInput()
                }}
                onKeyDown={handleKeyDown}
                placeholder='Ask for changes...'
                rows={1}
                className='flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                disabled={isLoading}
            />
            {isLoading ? (
                <Button size='icon' variant='outline' onClick={onStop}>
                    <Square className='size-4' />
                </Button>
            ) : (
                <Button size='icon' onClick={handleSend} disabled={!value.trim()}>
                    <ArrowUp className='size-4' />
                </Button>
            )}
        </div>
    )
}
