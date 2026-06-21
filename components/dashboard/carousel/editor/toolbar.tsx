'use client'

// ---------------------------------------------------------------------------
// Top toolbar: add elements, undo/redo, and entry points to templates, AI
// generation, the LinkedIn feed preview, and export. Dialog open-state lives
// here; each dialog is self-contained and talks to the store via context.
// ---------------------------------------------------------------------------
import * as React from 'react'
import {
    DownloadIcon,
    EyeIcon,
    ImageIcon,
    LayoutTemplateIcon,
    PlusIcon,
    RedoIcon,
    ShapesIcon,
    SmileIcon,
    SparklesIcon,
    TypeIcon,
    UndoIcon,
} from 'lucide-react'

import { createIconElement, createImageElement, createShapeElement, createTextElement } from '@/lib/carousel/factory'
import { type CarouselElement, type Slide } from '@/lib/carousel/types'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { useCarousel, useStoreApi } from '../use-carousel-store'
import { AiGenerateDialog } from './ai/ai-generate-dialog'
import { ExportDialog } from './export-dialog'
import { FeedPreviewDialog } from './feed-preview-dialog'
import { TemplatePicker } from './template-picker'

function textColorForSlide(slide: Slide): 'text' | 'accentText' {
    return slide.background.type === 'gradient' || slide.background.type === 'image' ? 'accentText' : 'text'
}

export function Toolbar() {
    const store = useStoreApi()
    const canUndo = useCarousel((s) => s.canUndo)
    const canRedo = useCarousel((s) => s.canRedo)

    const [templatesOpen, setTemplatesOpen] = React.useState(false)
    const [aiOpen, setAiOpen] = React.useState(false)
    const [previewOpen, setPreviewOpen] = React.useState(false)
    const [exportOpen, setExportOpen] = React.useState(false)

    const addElement = (type: CarouselElement['type']) => {
        const snap = store.getSnapshot()
        const slideId = snap.selectedSlideId
        const slide = snap.doc.slides.find((s) => s.id === slideId)
        if (!slideId || !slide) return
        const { width, height } = snap.doc.canvas
        const colorToken = textColorForSlide(slide)
        let element: CarouselElement
        if (type === 'text') {
            element = createTextElement({
                text: 'Add your text',
                x: 88,
                y: Math.round(height / 2 - 90),
                width: width - 176,
                height: 180,
                fontToken: 'heading',
                fontSize: 56,
                fontWeight: 700,
                align: 'center',
                colorToken,
            })
        } else if (type === 'image') {
            element = createImageElement({ x: Math.round(width / 2 - 300), y: Math.round(height / 2 - 300) })
        } else if (type === 'shape') {
            element = createShapeElement({
                shape: 'rect',
                x: Math.round(width / 2 - 200),
                y: Math.round(height / 2 - 120),
                width: 400,
                height: 240,
                radius: 32,
                fillToken: 'accent',
            })
        } else {
            element = createIconElement({
                x: Math.round(width / 2 - 60),
                y: Math.round(height / 2 - 60),
                width: 120,
                height: 120,
                colorToken: colorToken === 'accentText' ? 'accentText' : 'accent',
            })
        }
        store.addElement(slideId, element)
    }

    return (
        <>
            <div className='bg-background flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3'>
                <div className='flex items-center gap-1'>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size='sm' variant='outline'>
                                <PlusIcon className='size-4' />
                                Add
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='start'>
                            <DropdownMenuItem onClick={() => addElement('text')}>
                                <TypeIcon className='size-4' />
                                Text
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addElement('image')}>
                                <ImageIcon className='size-4' />
                                Image
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addElement('shape')}>
                                <ShapesIcon className='size-4' />
                                Shape
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addElement('icon')}>
                                <SmileIcon className='size-4' />
                                Icon
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className='bg-border mx-1 h-5 w-px' />

                    <Button size='icon-sm' variant='ghost' aria-label='Undo' disabled={!canUndo} onClick={store.undo}>
                        <UndoIcon className='size-4' />
                    </Button>
                    <Button size='icon-sm' variant='ghost' aria-label='Redo' disabled={!canRedo} onClick={store.redo}>
                        <RedoIcon className='size-4' />
                    </Button>
                </div>

                <div className='flex items-center gap-1.5'>
                    <Button size='sm' variant='ghost' onClick={() => setTemplatesOpen(true)}>
                        <LayoutTemplateIcon className='size-4' />
                        Templates
                    </Button>
                    <Button size='sm' variant='ghost' onClick={() => setAiOpen(true)}>
                        <SparklesIcon className='size-4' />
                        AI
                    </Button>
                    <Button size='sm' variant='ghost' onClick={() => setPreviewOpen(true)}>
                        <EyeIcon className='size-4' />
                        Preview
                    </Button>
                    <Button size='sm' onClick={() => setExportOpen(true)}>
                        <DownloadIcon className='size-4' />
                        Export
                    </Button>
                </div>
            </div>

            <TemplatePicker open={templatesOpen} onOpenChange={setTemplatesOpen} />
            <AiGenerateDialog open={aiOpen} onOpenChange={setAiOpen} />
            <FeedPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} />
            <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
        </>
    )
}
