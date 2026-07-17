'use client'

// ---------------------------------------------------------------------------
// Top-level carousel editor: loads/saves the document (use-carousel-document),
// provides the editor store, and lays out the rail, canvas, toolbar, and
// inspector. The rail and inspector are desktop affordances; on small screens
// the canvas + toolbar remain usable for quick edits, preview, and export.
// ---------------------------------------------------------------------------
import * as React from 'react'

import { useCarouselDocument } from '@/hooks/use-carousel-document'
import { Skeleton } from '@/components/ui/skeleton'

import { PageHeader } from '../page-header'
import { InspectorPanel } from './editor/inspector/inspector-panel'
import { SlideCanvas } from './editor/slide-canvas'
import { SlideRail } from './editor/slide-rail'
import { Toolbar } from './editor/toolbar'
import { CarouselStoreProvider } from './use-carousel-store'

export function CarouselEditor() {
    const { store, isLoading } = useCarouselDocument()

    if (isLoading || !store) {
        return (
            <>
                <PageHeader title='Carousel' />
                <div className='flex flex-1 items-center justify-center'>
                    <Skeleton className='aspect-[4/5] w-72 rounded-xl' />
                </div>
            </>
        )
    }

    return (
        <CarouselStoreProvider store={store}>
            <PageHeader title='Carousel' />
            <div className='flex min-h-0 flex-1 overflow-hidden'>
                <div className='hidden md:block'>
                    <SlideRail />
                </div>
                <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
                    <Toolbar />
                    <SlideCanvas />
                </div>
                <InspectorPanel />
            </div>
        </CarouselStoreProvider>
    )
}
