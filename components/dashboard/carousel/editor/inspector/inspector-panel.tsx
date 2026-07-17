'use client'

// ---------------------------------------------------------------------------
// Routes the right-hand inspector to the right editor: a single selected
// element -> ElementInspector; a multi-selection -> bulk actions; nothing
// selected -> the active slide + deck controls.
// ---------------------------------------------------------------------------
import * as React from 'react'
import { Trash2Icon } from 'lucide-react'

import { resolveTheme } from '@/lib/carousel/theme'
import { Button } from '@/components/ui/button'

import { shallowArrayEqual, useCarousel, useStoreApi } from '../../use-carousel-store'
import { Section } from './controls'
import { DeckInspector } from './deck-inspector'
import { ElementInspector } from './element-inspector'
import { SlideInspector } from './slide-inspector'

export function InspectorPanel() {
    const store = useStoreApi()
    const doc = useCarousel((s) => s.doc)
    const selectedSlideId = useCarousel((s) => s.selectedSlideId)
    const selectedIds = useCarousel((s) => s.selectedElementIds, shallowArrayEqual)
    const slide = doc.slides.find((s) => s.id === selectedSlideId) ?? doc.slides[0]
    const theme = React.useMemo(() => resolveTheme(doc.themeId, doc.themeOverrides), [doc.themeId, doc.themeOverrides])
    const single = selectedIds.length === 1 && slide ? slide.elements.find((e) => e.id === selectedIds[0]) : null

    return (
        <div className='bg-background no-scrollbar hidden h-full w-[280px] shrink-0 flex-col overflow-y-auto border-l lg:flex'>
            {single && slide ? (
                <ElementInspector slideId={slide.id} el={single} theme={theme} />
            ) : selectedIds.length > 1 ? (
                <Section title={`${selectedIds.length} elements selected`}>
                    <p className='text-muted-foreground mb-3 text-xs'>Drag to move them together, or:</p>
                    <Button
                        variant='outline'
                        size='sm'
                        className='hover:text-destructive w-full'
                        onClick={() => store.deleteSelectedElements()}>
                        <Trash2Icon className='size-3.5' />
                        Delete selected
                    </Button>
                </Section>
            ) : slide ? (
                <>
                    <SlideInspector slide={slide} theme={theme} />
                    <DeckInspector themeId={doc.themeId} ratio={doc.canvas.ratio} chrome={doc.brandChrome} />
                </>
            ) : null}
        </div>
    )
}
