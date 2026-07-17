'use client'

// ---------------------------------------------------------------------------
// Per-text-element AI actions (rewrite / shorten / punch up). Calls
// /api/carousel/edit with the element text + deck context + branding, then
// writes the result back as the element's content. Shown in the text inspector.
// ---------------------------------------------------------------------------
import * as React from 'react'
import { SparklesIcon } from 'lucide-react'
import { toast } from 'sonner'

import { assembleBrandingContext } from '@/lib/ai-branding'
import { summarizeDeck } from '@/lib/carousel/serialize'
import { tiptapFromText } from '@/lib/carousel/tiptap'
import { type TextElement } from '@/lib/carousel/types'
import { useBranding } from '@/hooks/use-branding'
import { Button } from '@/components/ui/button'

import { useStoreApi } from '../../use-carousel-store'

type EditAction = 'rewrite' | 'shorten' | 'punchup'

const ACTIONS: { action: EditAction; label: string }[] = [
    { action: 'rewrite', label: 'Rewrite' },
    { action: 'shorten', label: 'Shorten' },
    { action: 'punchup', label: 'Punch up' },
]

export function SlideAiActions({ slideId, el }: { slideId: string; el: TextElement }) {
    const store = useStoreApi()
    const { branding } = useBranding()
    const [pending, setPending] = React.useState<EditAction | null>(null)

    const run = async (action: EditAction) => {
        if (pending || !el.text.trim()) return
        setPending(action)
        try {
            const snap = store.getSnapshot()
            const res = await fetch('/api/carousel/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    headline: el.text,
                    deckSummary: summarizeDeck(snap.doc),
                    brandingContext: assembleBrandingContext(branding) || undefined,
                }),
            })
            if (res.status === 429) {
                toast.error('Daily AI limit reached. Try again tomorrow.')
                return
            }
            if (!res.ok) throw new Error('edit')
            const data = (await res.json()) as { headline: string }
            if (!data.headline) throw new Error('empty')
            store.updateElement(slideId, el.id, { text: data.headline, html: tiptapFromText(data.headline) })
        } catch {
            toast.error('AI edit failed. Please try again.')
        } finally {
            setPending(null)
        }
    }

    return (
        <div className='border-border/60 border-b px-4 py-3'>
            <p className='text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs font-semibold'>
                <SparklesIcon className='text-primary size-3.5' />
                AI
            </p>
            <div className='flex gap-1.5'>
                {ACTIONS.map(({ action, label }) => (
                    <Button
                        key={action}
                        variant='outline'
                        size='sm'
                        className='flex-1 px-1'
                        disabled={!!pending || !el.text.trim()}
                        onClick={() => run(action)}>
                        {pending === action ? (
                            <span className='border-foreground size-3.5 animate-spin rounded-full border-2 border-t-transparent' />
                        ) : (
                            label
                        )}
                    </Button>
                ))}
            </div>
        </div>
    )
}
