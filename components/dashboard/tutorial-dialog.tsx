'use client'

import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

const STORAGE_KEY = 'lp-tutorial-seen'

type Slide = {
    title: string
    description: string
    videoPlaceholder: string
}

const SLIDES: Slide[] = [
    {
        title: 'Welcome to LinkedInPreview',
        description: 'Your all-in-one tool for creating, previewing, and perfecting LinkedIn posts before publishing.',
        videoPlaceholder: 'Welcome overview video',
    },
    {
        title: 'Create Posts',
        description:
            'Use the AI-powered wizard to generate posts from notes, voice, files, or URLs. Choose from multiple hooks and variants.',
        videoPlaceholder: 'Post creation demo video',
    },
    {
        title: 'Brand Your Voice',
        description:
            'Set up your personal branding - define your writing style, tone, and expertise so AI generates content that sounds like you.',
        videoPlaceholder: 'Branding setup demo video',
    },
    {
        title: 'Analyze & Improve',
        description:
            'Get instant feedback on your posts with AI-powered scoring, readability analysis, and actionable suggestions.',
        videoPlaceholder: 'Analysis demo video',
    },
]

export function TutorialDialog() {
    const [open, setOpen] = React.useState(false)
    const [current, setCurrent] = React.useState(0)

    React.useEffect(() => {
        try {
            const seen = localStorage.getItem(STORAGE_KEY)
            if (!seen) {
                setOpen(true)
            }
        } catch {}
    }, [])

    const handleClose = () => {
        setOpen(false)
        try {
            localStorage.setItem(STORAGE_KEY, 'true')
        } catch {}
    }

    const slide = SLIDES[current]

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className='max-w-2xl gap-0 overflow-hidden p-0'>
                <DialogTitle className='sr-only'>Tutorial</DialogTitle>

                {/* Video placeholder */}
                <div className='bg-muted flex aspect-video w-full items-center justify-center'>
                    <p className='text-muted-foreground text-sm'>{slide.videoPlaceholder}</p>
                </div>

                {/* Content */}
                <div className='space-y-4 p-6'>
                    <div>
                        <h2 className='text-xl font-semibold'>{slide.title}</h2>
                        <p className='text-muted-foreground mt-1 text-sm'>{slide.description}</p>
                    </div>

                    {/* Navigation */}
                    <div className='flex items-center justify-between'>
                        <div className='flex gap-1.5'>
                            {SLIDES.map((_, i) => (
                                <button
                                    key={i}
                                    type='button'
                                    onClick={() => setCurrent(i)}
                                    className={cn(
                                        'size-2 rounded-full transition-colors',
                                        i === current ? 'bg-primary' : 'bg-muted-foreground/30',
                                    )}
                                />
                            ))}
                        </div>
                        <div className='flex items-center gap-2'>
                            {current > 0 && (
                                <Button variant='outline' size='sm' onClick={() => setCurrent(current - 1)}>
                                    <ChevronLeftIcon className='size-4' />
                                    Back
                                </Button>
                            )}
                            {current < SLIDES.length - 1 ? (
                                <Button size='sm' onClick={() => setCurrent(current + 1)}>
                                    Next
                                    <ChevronRightIcon className='size-4' />
                                </Button>
                            ) : (
                                <Button size='sm' onClick={handleClose}>
                                    Get Started
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
