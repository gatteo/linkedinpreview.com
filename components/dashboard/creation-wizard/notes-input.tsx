'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const MAX_CHARS = 5000

interface NotesInputProps {
    onSubmit: (text: string) => void
    onBack: () => void
}

export function NotesInput({ onSubmit, onBack }: NotesInputProps) {
    const [text, setText] = React.useState('')

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.length <= MAX_CHARS) {
            setText(e.target.value)
        }
    }

    return (
        <div className='flex flex-col gap-3'>
            <div className='relative'>
                <Textarea
                    value={text}
                    onChange={handleChange}
                    placeholder='Paste your notes, ideas, or draft here...'
                    className='min-h-40 resize-none pb-6'
                    autoFocus
                />
                <span className='text-muted-foreground absolute right-2.5 bottom-2 text-xs'>
                    {text.length}/{MAX_CHARS}
                </span>
            </div>
            <div className='flex justify-between gap-2'>
                <Button variant='outline' onClick={onBack}>
                    Back
                </Button>
                <Button onClick={() => onSubmit(text)} disabled={text.trim().length === 0}>
                    Generate
                </Button>
            </div>
        </div>
    )
}
