'use client'

import { useState } from 'react'
import { ArrowDownToLine, ArrowUpToLine, Loader2, Paintbrush, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { TONE_OPTIONS, type Tone } from '@/config/ai'
import { ApiRoutes } from '@/config/routes'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AIActionsProps {
    postText: string
    brandingContext: string
    onResult: (newText: string) => void
    disabled?: boolean
}

type Action = 'restyle' | 'hooks' | 'shorten' | 'lengthen' | 'variation'

export function AIActions({ postText, brandingContext, onResult, disabled }: AIActionsProps) {
    const [activeAction, setActiveAction] = useState<string | null>(null)
    const [hooks, setHooks] = useState<string[]>([])
    const [hooksOpen, setHooksOpen] = useState(false)

    const isDisabled = disabled || !!activeAction || !postText.trim()
    const isStyleLoading = activeAction?.startsWith('restyle')

    async function runAction(action: Action, tone?: Tone) {
        const actionKey = tone ? `${action}-${tone}` : action
        setActiveAction(actionKey)
        try {
            const body: Record<string, string> = { action, brandingContext }
            if (action === 'hooks') {
                body.sourceText = postText
            } else {
                body.postText = postText
            }
            if (tone) body.tone = tone

            const res = await fetch(ApiRoutes.Generate, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) throw new Error('Request failed')
            const data = await res.json()

            if (action === 'hooks') {
                const parsed: string[] = Array.isArray(data.result) ? data.result : [data.result]
                setHooks(parsed)
                setHooksOpen(true)
            } else {
                onResult(data.result)
            }
        } catch {
            toast.error('Failed to generate content')
        } finally {
            setActiveAction(null)
        }
    }

    return (
        <div className='flex items-center gap-1 border-t px-4 py-2'>
            {/* Style - tone dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm' disabled={isDisabled}>
                        {isStyleLoading ? <Loader2 className='animate-spin' /> : <Paintbrush />}
                        Style
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start'>
                    {TONE_OPTIONS.map((tone) => (
                        <DropdownMenuItem key={tone.value} onSelect={() => runAction('restyle', tone.value)}>
                            {tone.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Hook - generates options to pick from */}
            <DropdownMenu open={hooksOpen} onOpenChange={setHooksOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant='ghost'
                        size='sm'
                        disabled={isDisabled}
                        onClick={(e) => {
                            if (hooks.length === 0) {
                                e.preventDefault()
                                runAction('hooks')
                            }
                        }}>
                        {activeAction === 'hooks' ? <Loader2 className='animate-spin' /> : <Sparkles />}
                        Hook
                    </Button>
                </DropdownMenuTrigger>
                {hooks.length > 0 && (
                    <DropdownMenuContent align='start' className='w-80'>
                        <DropdownMenuLabel>Pick a hook</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {hooks.map((hook, i) => (
                            <DropdownMenuItem
                                key={i}
                                className='whitespace-normal'
                                onSelect={() => {
                                    onResult(hook)
                                    setHooks([])
                                    setHooksOpen(false)
                                }}>
                                {hook}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => {
                                setHooks([])
                                runAction('hooks')
                            }}>
                            <RefreshCw className='mr-1' />
                            Regenerate
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                )}
            </DropdownMenu>

            {/* Shorter */}
            <Button variant='ghost' size='sm' disabled={isDisabled} onClick={() => runAction('shorten')}>
                {activeAction === 'shorten' ? <Loader2 className='animate-spin' /> : <ArrowDownToLine />}
                Shorter
            </Button>

            {/* Longer */}
            <Button variant='ghost' size='sm' disabled={isDisabled} onClick={() => runAction('lengthen')}>
                {activeAction === 'lengthen' ? <Loader2 className='animate-spin' /> : <ArrowUpToLine />}
                Longer
            </Button>

            {/* Variation */}
            <Button variant='ghost' size='sm' disabled={isDisabled} onClick={() => runAction('variation')}>
                {activeAction === 'variation' ? <Loader2 className='animate-spin' /> : <RefreshCw />}
                Variation
            </Button>
        </div>
    )
}
