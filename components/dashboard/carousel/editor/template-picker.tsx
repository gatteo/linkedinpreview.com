'use client'

// ---------------------------------------------------------------------------
// Template gallery. Each card previews the template's first slide rendered with
// the user's current theme. Applying a template replaces the deck (undoable)
// while preserving the user's theme, ratio, and branding identity.
// ---------------------------------------------------------------------------
import * as React from 'react'

import { TEMPLATES, type CarouselTemplate } from '@/lib/carousel/templates'
import { resolveTheme } from '@/lib/carousel/theme'
import { type CarouselDocument } from '@/lib/carousel/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { SlideArtboard } from '../render/slide-artboard'
import { useStoreApi } from '../use-carousel-store'

const THUMB_WIDTH = 188

function TemplateCard({
    doc,
    onApply,
    name,
    description,
    category,
}: {
    doc: CarouselDocument
    onApply: () => void
    name: string
    description: string
    category: string
}) {
    const theme = React.useMemo(() => resolveTheme(doc.themeId, doc.themeOverrides), [doc.themeId, doc.themeOverrides])
    const scale = THUMB_WIDTH / doc.canvas.width
    return (
        <button
            type='button'
            onClick={onApply}
            className='group/tpl hover:border-primary focus-visible:border-primary overflow-hidden rounded-xl border text-left transition-colors focus-visible:outline-none'>
            <div className='bg-muted overflow-hidden' style={{ width: THUMB_WIDTH, height: doc.canvas.height * scale }}>
                <div
                    style={{
                        width: doc.canvas.width,
                        height: doc.canvas.height,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                    }}>
                    <SlideArtboard slide={doc.slides[0]} doc={doc} theme={theme} index={0} total={doc.slides.length} />
                </div>
            </div>
            <div className='p-2.5'>
                <div className='flex items-center justify-between gap-2'>
                    <p className='truncate text-sm font-semibold'>{name}</p>
                    <Badge variant='secondary' className='shrink-0 text-[10px]'>
                        {category}
                    </Badge>
                </div>
                <p className='text-muted-foreground mt-0.5 line-clamp-2 text-xs'>{description}</p>
            </div>
        </button>
    )
}

export function TemplatePicker({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const store = useStoreApi()

    // Build the preview docs lazily with the user's current theme/ratio.
    const previews = React.useMemo(() => {
        if (!open) return [] as { tpl: CarouselTemplate; doc: CarouselDocument }[]
        const snap = store.getSnapshot()
        return TEMPLATES.map((tpl) => ({
            tpl,
            doc: tpl.build({ themeId: snap.doc.themeId, ratio: snap.doc.canvas.ratio }),
        }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const apply = (tpl: CarouselTemplate) => {
        const snap = store.getSnapshot()
        const built = tpl.build({ themeId: snap.doc.themeId, ratio: snap.doc.canvas.ratio })
        built.brandChrome = {
            ...built.brandChrome,
            name: snap.doc.brandChrome.name,
            handle: snap.doc.brandChrome.handle,
            avatarUrl: snap.doc.brandChrome.avatarUrl,
        }
        store.loadDocument(built, { resetHistory: false })
        store.selectSlide(built.slides[0]?.id ?? null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn('max-h-[85vh] overflow-y-auto sm:max-w-3xl')}>
                <DialogHeader>
                    <DialogTitle>Start from a template</DialogTitle>
                    <DialogDescription>
                        Pick a structure and make it yours. Your theme and branding are kept; you can undo.
                    </DialogDescription>
                </DialogHeader>
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
                    {previews.map(({ tpl, doc }) => (
                        <TemplateCard
                            key={tpl.id}
                            doc={doc}
                            name={tpl.name}
                            description={tpl.description}
                            category={tpl.category}
                            onApply={() => apply(tpl)}
                        />
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
