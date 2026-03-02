'use client'

import * as React from 'react'
import { Loader2Icon, RefreshCwIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface HookPickerProps {
    hooks: Array<{ text: string; category: string; type: string }>
    onSelect: (hookText: string) => void
    onRegenerate: () => void
    isRegenerating: boolean
}

export function HookPicker({ hooks, onSelect, onRegenerate, isRegenerating }: HookPickerProps) {
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null)
    const [writeOwn, setWriteOwn] = React.useState(false)
    const [ownText, setOwnText] = React.useState('')

    const selectedText = writeOwn ? ownText : selectedIndex !== null ? (hooks[selectedIndex]?.text ?? null) : null
    const canProceed = writeOwn ? ownText.trim().length > 0 : selectedIndex !== null

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
                {hooks.map((hook, i) => (
                    <button
                        key={i}
                        type='button'
                        onClick={() => {
                            setSelectedIndex(i)
                            setWriteOwn(false)
                        }}
                        className={cn(
                            'rounded-lg border p-3 text-left transition-colors',
                            selectedIndex === i && !writeOwn
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-accent border-border',
                        )}>
                        <p className='mb-2 text-sm leading-snug'>{hook.text}</p>
                        <div className='flex gap-1.5'>
                            <Badge variant='secondary'>{hook.category}</Badge>
                            <Badge variant='outline'>{hook.type}</Badge>
                        </div>
                    </button>
                ))}

                {/* Write my own */}
                {writeOwn ? (
                    <div className='border-primary bg-primary/5 rounded-lg border p-3'>
                        <p className='mb-2 text-sm font-medium'>Write your own hook</p>
                        <Textarea
                            autoFocus
                            placeholder='Type your opening line...'
                            value={ownText}
                            onChange={(e) => setOwnText(e.target.value)}
                            className='min-h-20 resize-none text-sm'
                        />
                    </div>
                ) : (
                    <button
                        type='button'
                        onClick={() => {
                            setWriteOwn(true)
                            setSelectedIndex(null)
                        }}
                        className='hover:bg-accent text-muted-foreground rounded-lg border border-dashed p-3 text-left text-sm transition-colors'>
                        Write my own hook...
                    </button>
                )}
            </div>

            <div className='flex items-center justify-between'>
                <Button variant='ghost' size='sm' onClick={onRegenerate} disabled={isRegenerating}>
                    {isRegenerating ? (
                        <Loader2Icon className='size-4 animate-spin' />
                    ) : (
                        <RefreshCwIcon className='size-4' />
                    )}
                    Regenerate
                </Button>
                <Button disabled={!canProceed || isRegenerating} onClick={() => selectedText && onSelect(selectedText)}>
                    Next
                </Button>
            </div>
        </div>
    )
}
