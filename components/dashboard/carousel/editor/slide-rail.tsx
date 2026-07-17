'use client'

// ---------------------------------------------------------------------------
// Vertical strip of slide thumbnails: select, reorder (drag), add, duplicate,
// delete. Each thumbnail renders the real SlideArtboard at a small scale so it
// is a true preview. Thumbnails are memoized on the fields the artboard
// actually consumes, so during element edits only the changed slide's thumb
// re-renders (the rail is otherwise a per-frame hot path).
// ---------------------------------------------------------------------------
import * as React from 'react'
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CopyIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { resolveTheme, type ResolvedTheme } from '@/lib/carousel/theme'
import { type CarouselDocument, type Slide } from '@/lib/carousel/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { SlideArtboard } from '../render/slide-artboard'
import { shallowArrayEqual, useCarousel, useStoreApi } from '../use-carousel-store'

const THUMB_WIDTH = 132

type ThumbProps = {
    slide: Slide
    doc: CarouselDocument
    theme: ResolvedTheme
    index: number
    total: number
}

const SlideThumbPreview = React.memo(
    function SlideThumbPreview({ slide, doc, theme, index, total }: ThumbProps) {
        const scale = THUMB_WIDTH / doc.canvas.width
        return (
            <div
                className='pointer-events-none overflow-hidden rounded-md'
                style={{ width: THUMB_WIDTH, height: doc.canvas.height * scale }}>
                <div
                    style={{
                        width: doc.canvas.width,
                        height: doc.canvas.height,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                    }}>
                    <SlideArtboard slide={slide} doc={doc} theme={theme} index={index} total={total} />
                </div>
            </div>
        )
    },
    (prev, next) =>
        prev.slide === next.slide &&
        prev.theme === next.theme &&
        prev.doc.canvas === next.doc.canvas &&
        prev.doc.brandChrome === next.doc.brandChrome &&
        prev.index === next.index &&
        prev.total === next.total,
)

function SortableSlide({
    slide,
    doc,
    theme,
    index,
    total,
    selected,
    onSelect,
}: ThumbProps & { selected: boolean; onSelect: () => void }) {
    const store = useStoreApi()
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id })

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn('group/slide relative', isDragging && 'z-10 opacity-80')}>
            <button
                type='button'
                onClick={onSelect}
                {...attributes}
                {...listeners}
                className={cn(
                    'relative block w-full rounded-lg border-2 bg-transparent p-0 transition-colors',
                    selected ? 'border-primary' : 'hover:border-border border-transparent',
                )}
                aria-label={`Slide ${index + 1}`}
                aria-current={selected}>
                <span className='bg-background/90 text-muted-foreground absolute top-1 left-1 z-10 rounded px-1.5 text-[10px] font-semibold'>
                    {index + 1}
                </span>
                <SlideThumbPreview slide={slide} doc={doc} theme={theme} index={index} total={total} />
            </button>
            <div className='absolute top-1 right-1 z-10 flex gap-0.5 opacity-0 transition-opacity group-hover/slide:opacity-100'>
                <Button
                    size='icon-xs'
                    variant='secondary'
                    className='size-6 shadow-sm'
                    aria-label='Duplicate slide'
                    onClick={(e) => {
                        e.stopPropagation()
                        store.duplicateSlide(slide.id)
                    }}>
                    <CopyIcon className='size-3' />
                </Button>
                {total > 1 ? (
                    <Button
                        size='icon-xs'
                        variant='secondary'
                        className='hover:text-destructive size-6 shadow-sm'
                        aria-label='Delete slide'
                        onClick={(e) => {
                            e.stopPropagation()
                            store.deleteSlide(slide.id)
                        }}>
                        <Trash2Icon className='size-3' />
                    </Button>
                ) : null}
            </div>
        </div>
    )
}

export function SlideRail() {
    const store = useStoreApi()
    const doc = useCarousel((s) => s.doc)
    const selectedSlideId = useCarousel((s) => s.selectedSlideId)
    const slideIds = useCarousel((s) => s.doc.slides.map((slide) => slide.id), shallowArrayEqual)
    const theme = React.useMemo(() => resolveTheme(doc.themeId, doc.themeOverrides), [doc.themeId, doc.themeOverrides])
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e
        if (!over || active.id === over.id) return
        const from = slideIds.indexOf(active.id as string)
        const to = slideIds.indexOf(over.id as string)
        if (from >= 0 && to >= 0) store.moveSlide(from, to)
    }

    return (
        <div className='bg-background flex h-full w-[164px] shrink-0 flex-col border-r'>
            <div className='flex items-center justify-between px-3 py-2'>
                <span className='text-muted-foreground text-xs font-medium'>Slides</span>
                <span className='text-muted-foreground text-[10px]'>{doc.slides.length}</span>
            </div>
            <div className='no-scrollbar flex-1 space-y-2 overflow-y-auto px-3 pb-3'>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}>
                    <SortableContext items={slideIds} strategy={verticalListSortingStrategy}>
                        {doc.slides.map((slide, i) => (
                            <SortableSlide
                                key={slide.id}
                                slide={slide}
                                doc={doc}
                                theme={theme}
                                index={i}
                                total={doc.slides.length}
                                selected={slide.id === selectedSlideId}
                                onSelect={() => store.selectSlide(slide.id)}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
                <Button
                    variant='outline'
                    className='h-9 w-full border-dashed'
                    onClick={() => store.addSlide('body', selectedSlideId)}>
                    <PlusIcon className='size-4' />
                    Add slide
                </Button>
            </div>
        </div>
    )
}
