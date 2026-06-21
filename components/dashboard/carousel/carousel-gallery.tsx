'use client'

// ---------------------------------------------------------------------------
// Carousel list surface: the user's saved carousels (kind:'carousel') as cards,
// plus entry points to create a new one or start from a template. Shares the
// drafts table + useDrafts CRUD, scoped to the carousel kind.
// ---------------------------------------------------------------------------
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CopyIcon, LayoutGridIcon, MoreHorizontalIcon, PlusIcon, SparklesIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { blankDocument } from '@/lib/carousel/factory'
import { useDrafts } from '@/hooks/use-drafts'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

import { PageHeader } from '../page-header'

export function CarouselGallery() {
    const router = useRouter()
    const { drafts, isLoading, createDraft, deleteDraft, duplicateDraft } = useDrafts({ kind: 'carousel' })
    const [creating, setCreating] = React.useState(false)

    const handleNew = async () => {
        if (creating) return
        setCreating(true)
        try {
            const entry = await createDraft(blankDocument())
            router.push(`/dashboard/carousel/editor?draft=${entry.id}`)
        } catch {
            toast.error('Could not create carousel')
            setCreating(false)
        }
    }

    const handleDuplicate = async (id: string) => {
        const entry = await duplicateDraft(id)
        if (entry) toast.success('Carousel duplicated')
    }

    return (
        <>
            <PageHeader title='Carousels'>
                <Button size='sm' onClick={handleNew} disabled={creating}>
                    <PlusIcon className='size-4' />
                    New carousel
                </Button>
            </PageHeader>

            <div className='flex-1 overflow-y-auto p-4 lg:p-6'>
                {isLoading ? (
                    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className='aspect-[4/5] rounded-xl' />
                        ))}
                    </div>
                ) : drafts.length === 0 ? (
                    <div className='mx-auto mt-10 flex max-w-md flex-col items-center text-center'>
                        <div className='bg-primary/10 text-primary mb-4 flex size-14 items-center justify-center rounded-2xl'>
                            <LayoutGridIcon className='size-7' />
                        </div>
                        <h2 className='text-xl font-semibold'>Create your first carousel</h2>
                        <p className='text-muted-foreground mt-1.5 text-sm'>
                            Design a swipeable LinkedIn document post. Start from scratch, a template, or let AI draft
                            it from a topic.
                        </p>
                        <div className='mt-5 flex gap-2'>
                            <Button onClick={handleNew} disabled={creating}>
                                <PlusIcon className='size-4' />
                                New carousel
                            </Button>
                            <Button variant='outline' onClick={handleNew} disabled={creating}>
                                <SparklesIcon className='size-4' />
                                Start with AI
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
                        <button
                            type='button'
                            onClick={handleNew}
                            disabled={creating}
                            className='hover:border-primary hover:text-primary text-muted-foreground flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors'>
                            <PlusIcon className='size-7' />
                            <span className='text-sm font-medium'>New carousel</span>
                        </button>

                        {drafts.map((draft) => (
                            <div
                                key={draft.id}
                                className='group/card hover:border-primary relative flex aspect-[4/5] cursor-pointer flex-col overflow-hidden rounded-xl border transition-colors'
                                onClick={() => router.push(`/dashboard/carousel/editor?draft=${draft.id}`)}>
                                <div className='from-primary/15 to-primary/5 flex flex-1 items-center justify-center bg-gradient-to-br'>
                                    <LayoutGridIcon className='text-primary/40 size-10' />
                                </div>
                                <div className='bg-background flex items-center justify-between gap-1 border-t p-2.5'>
                                    <div className='min-w-0'>
                                        <p className='truncate text-sm font-medium'>{draft.title || 'Untitled'}</p>
                                        <p className='text-muted-foreground text-xs'>
                                            {new Date(draft.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button size='icon-sm' variant='ghost' aria-label='Carousel options'>
                                                <MoreHorizontalIcon className='size-4' />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align='end' onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={() => handleDuplicate(draft.id)}>
                                                <CopyIcon className='size-4' />
                                                Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className='text-destructive focus:text-destructive'
                                                onClick={() => deleteDraft(draft.id)}>
                                                <Trash2Icon className='size-4' />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
