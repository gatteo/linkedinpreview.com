'use client'

import React from 'react'
import { useCompletion } from '@ai-sdk/react'
import posthog from 'posthog-js'
import { toast } from 'sonner'

import { ApiRoutes } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface GenerateSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onInsert: (text: string) => void
}

export function GenerateSheet({ open, onOpenChange, onInsert }: GenerateSheetProps) {
    const [input, setInput] = React.useState('')

    const { completion, complete, isLoading } = useCompletion({
        api: ApiRoutes.Generate,
        streamProtocol: 'text',
        onFinish: (_prompt, completion) => {
            posthog.capture('ai_generation_completed', { output_length: completion.length })
        },
        onError: (err) => {
            posthog.captureException(err)
            toast.error('Failed to generate post. Please try again.')
        },
    })

    const handleGenerate = React.useCallback(() => {
        if (!input.trim()) return
        posthog.capture('ai_generation_started', { input_length: input.length })
        complete(input)
    }, [input, complete])

    const handleInsert = React.useCallback(() => {
        if (!completion) return
        posthog.capture('ai_generation_inserted')
        onInsert(completion)
        onOpenChange(false)
    }, [completion, onInsert, onOpenChange])

    const hasOutput = completion.length > 0

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className='flex flex-col'>
                <SheetHeader>
                    <SheetTitle>Generate with AI</SheetTitle>
                    <SheetDescription>
                        Enter your topic, key points, or rough draft and AI will write a LinkedIn post for you.
                    </SheetDescription>
                </SheetHeader>

                <div className='flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6'>
                    <div className='flex flex-col gap-2'>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder='Enter your topic, key points, or rough draft…'
                            rows={4}
                            className='w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                            disabled={isLoading}
                        />
                        <div className='flex gap-2'>
                            <Button onClick={handleGenerate} disabled={!input.trim() || isLoading} className='flex-1'>
                                {isLoading ? 'Generating…' : hasOutput ? 'Regenerate' : 'Generate'}
                            </Button>
                        </div>
                    </div>

                    {(hasOutput || isLoading) && (
                        <div className='flex flex-1 flex-col gap-2'>
                            <p className='text-xs font-medium text-muted-foreground'>Preview</p>
                            <div className='flex-1 overflow-y-auto rounded-md border bg-muted/30 p-3'>
                                <p className='whitespace-pre-wrap text-sm'>
                                    {completion}
                                    {isLoading && (
                                        <span className='ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground' />
                                    )}
                                </p>
                            </div>
                            {hasOutput && !isLoading && (
                                <Button onClick={handleInsert} variant='default'>
                                    Insert into Editor
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
