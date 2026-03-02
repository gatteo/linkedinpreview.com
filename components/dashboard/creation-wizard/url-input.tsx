'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface UrlInputProps {
    onSubmit: (text: string) => void
    onBack: () => void
}

export function UrlInput({ onSubmit, onBack }: UrlInputProps) {
    const [url, setUrl] = React.useState('')
    const [isLoading, setIsLoading] = React.useState(false)
    const [title, setTitle] = React.useState('')
    const [extractedText, setExtractedText] = React.useState('')

    const handleExtract = async () => {
        if (!url.trim()) return
        setIsLoading(true)

        try {
            const res = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            })
            if (!res.ok) throw new Error('Extraction failed')
            const data = await res.json()
            setTitle(data.title ?? '')
            setExtractedText(data.text ?? '')
        } catch {
            toast.error('Failed to extract content from URL')
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleExtract()
    }

    const hasResult = extractedText.length > 0

    return (
        <div className='flex flex-col gap-3'>
            <div className='flex gap-2'>
                <Input
                    type='url'
                    placeholder='https://example.com/article'
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className='flex-1'
                />
                <Button onClick={handleExtract} disabled={url.trim().length === 0 || isLoading}>
                    {isLoading ? (
                        <span className='border-primary-foreground size-4 animate-spin rounded-full border-2 border-t-transparent' />
                    ) : (
                        'Extract'
                    )}
                </Button>
            </div>

            {hasResult && (
                <div className='flex flex-col gap-2'>
                    {title.length > 0 && <p className='text-sm font-medium'>{title}</p>}
                    <Textarea value={extractedText} readOnly className='min-h-36 resize-none' />
                </div>
            )}

            <div className='flex justify-between gap-2'>
                <Button variant='outline' onClick={onBack}>
                    Back
                </Button>
                {hasResult && (
                    <Button onClick={() => onSubmit(extractedText)} disabled={extractedText.trim().length === 0}>
                        Use this text
                    </Button>
                )}
            </div>
        </div>
    )
}
