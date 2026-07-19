'use client'

import React from 'react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

type Props = {
    onSelect: (native: string) => void
}

type PickerEmoji = {
    native?: string
}

type PickerStatus = 'loading' | 'ready' | 'error'

// Kept in sync with the loading fallback rendered by the toolbar so the popover
// does not resize once the picker chunk lands.
const PANEL_SIZE = 'h-[352px] w-[min(21rem,calc(100vw-2.5rem))]'

export function EmojiPickerPanel({ onSelect }: Props) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const { resolvedTheme } = useTheme()
    const [status, setStatus] = React.useState<PickerStatus>('loading')
    const [attempt, setAttempt] = React.useState(0)

    // The picker is instantiated once per theme, so the callback is read through a ref
    // instead of being a dependency of the mount effect.
    const onSelectRef = React.useRef(onSelect)
    React.useEffect(() => {
        onSelectRef.current = onSelect
    }, [onSelect])

    React.useEffect(() => {
        let element: HTMLElement | null = null
        let cancelled = false

        setStatus('loading')

        async function mount() {
            const [{ Picker, init }, data] = await Promise.all([
                import('emoji-mart'),
                // ~1.4MB of emoji data. The async form keeps it in its own chunk so it
                // is fetched the first time the picker opens, never on page load.
                import('@emoji-mart/data').then((module) => module.default),
            ])

            if (cancelled) return

            // emoji-mart's own init call inside connectedCallback is fire and forget, so a
            // failing data load there would reject with no handler and leave the picker
            // blank forever. Priming it here makes the failure catchable and means the
            // element only gets created once the data is parsed and indexed.
            await init({ data, set: 'native' })

            if (cancelled || !containerRef.current) return

            element = new Picker({
                data,
                // Native codepoints only. The result is pasted into LinkedIn, where a
                // sprite, image URL or shortcode would be broken output. It also avoids
                // runtime sprite requests to an external CDN.
                set: 'native',
                theme: resolvedTheme === 'dark' ? 'dark' : 'light',
                previewPosition: 'none',
                dynamicWidth: true,
                autoFocus: false,
                onEmojiSelect: (emoji: PickerEmoji) => {
                    if (emoji?.native) onSelectRef.current(emoji.native)
                },
                ref: containerRef,
            }) as unknown as HTMLElement

            // The custom element sizes itself to min-content with its own shadow.
            // Inline styles beat its :host rules so it fills the popover cleanly.
            element.style.width = '100%'
            element.style.height = '100%'
            element.style.boxShadow = 'none'

            // connectedCallback renders into the shadow root asynchronously. Waiting for
            // the next frame keeps the loading state up until there is something to see.
            await new Promise((resolve) => requestAnimationFrame(resolve))

            if (cancelled) return
            setStatus('ready')
        }

        mount().catch(() => {
            if (!cancelled) setStatus('error')
        })

        return () => {
            cancelled = true
            // The picker mounts imperative DOM outside React. Detaching the element fires
            // its disconnectedCallback, which unregisters the internal component and stops
            // instances from piling up as the popover is reopened.
            element?.remove()
            element = null
        }
    }, [resolvedTheme, attempt])

    return (
        <div className='relative'>
            <div ref={containerRef} className={PANEL_SIZE} aria-label='Emoji picker' />
            {status !== 'ready' && (
                <div className='text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-sm'>
                    {status === 'error' ? (
                        <>
                            <span>Could not load the emoji picker.</span>
                            <Button variant='outline' size='sm' onClick={() => setAttempt((value) => value + 1)}>
                                Try again
                            </Button>
                        </>
                    ) : (
                        'Loading emoji...'
                    )}
                </div>
            )}
        </div>
    )
}
