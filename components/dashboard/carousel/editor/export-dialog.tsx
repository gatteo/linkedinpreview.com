'use client'

// ---------------------------------------------------------------------------
// Export dialog: PDF (the LinkedIn document format - always the primary path)
// or a ZIP of per-slide PNGs (plus the PDF). Rendering + assembly is fully
// client-side; a progress readout reflects per-slide rasterization.
// ---------------------------------------------------------------------------
import * as React from 'react'
import { FileTextIcon, ImagesIcon } from 'lucide-react'
import { toast } from 'sonner'

import { carouselTitle } from '@/lib/carousel/serialize'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { useCarousel } from '../use-carousel-store'

type ExportFormat = 'pdf' | 'images'

function slugify(input: string): string {
    return (
        input
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 48) || 'carousel'
    )
}

export function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const doc = useCarousel((s) => s.doc)
    const [busy, setBusy] = React.useState<ExportFormat | null>(null)
    const [progress, setProgress] = React.useState({ done: 0, total: 0 })

    const run = async (format: ExportFormat) => {
        if (busy) return
        setBusy(format)
        setProgress({ done: 0, total: doc.slides.length })
        try {
            const { exportCarousel } = await import('@/lib/carousel/export')
            await exportCarousel(doc, format, slugify(carouselTitle(doc)), (done, total) =>
                setProgress({ done, total }),
            )
            toast.success(format === 'pdf' ? 'PDF downloaded' : 'ZIP downloaded')
            onOpenChange(false)
        } catch {
            toast.error('Export failed. Please try again.')
        } finally {
            setBusy(null)
        }
    }

    const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0

    return (
        <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Export carousel</DialogTitle>
                    <DialogDescription>
                        Upload the PDF to LinkedIn as a document post. No watermark, exported at 2x for crisp text.
                    </DialogDescription>
                </DialogHeader>

                {busy ? (
                    <div className='space-y-3 py-4'>
                        <p className='text-sm font-medium'>
                            Rendering slide {progress.done} of {progress.total}...
                        </p>
                        <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                            <div className='bg-primary h-full transition-all' style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                ) : (
                    <div className='grid grid-cols-2 gap-3'>
                        <ExportOption
                            icon={<FileTextIcon className='size-6' />}
                            title='PDF document'
                            hint='Recommended for LinkedIn'
                            onClick={() => run('pdf')}
                        />
                        <ExportOption
                            icon={<ImagesIcon className='size-6' />}
                            title='Images (ZIP)'
                            hint='PNG per slide + PDF'
                            onClick={() => run('images')}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function ExportOption({
    icon,
    title,
    hint,
    onClick,
}: {
    icon: React.ReactNode
    title: string
    hint: string
    onClick: () => void
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            className={cn(
                'hover:border-primary hover:bg-accent flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-colors',
            )}>
            <span className='text-primary'>{icon}</span>
            <span className='text-sm font-semibold'>{title}</span>
            <span className='text-muted-foreground text-xs'>{hint}</span>
        </button>
    )
}
