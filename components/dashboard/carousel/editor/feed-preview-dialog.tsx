'use client'

import * as React from 'react'

import { useBranding } from '@/hooks/use-branding'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { CarouselFeedPreview } from '../render/carousel-feed-preview'
import { useCarousel } from '../use-carousel-store'

export function FeedPreviewDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const doc = useCarousel((s) => s.doc)
    const { branding } = useBranding()

    const author = {
        name: branding.profile.name || doc.brandChrome.name || 'Your name',
        headline: branding.profile.headline || 'Your headline',
        avatarUrl: branding.profile.avatarUrl || doc.brandChrome.avatarUrl || '',
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[560px]'>
                <DialogHeader>
                    <DialogTitle>LinkedIn feed preview</DialogTitle>
                    <DialogDescription>
                        How your document post will look in the feed. Swipe through the slides.
                    </DialogDescription>
                </DialogHeader>
                <div className='flex justify-center'>
                    <CarouselFeedPreview doc={doc} author={author} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
