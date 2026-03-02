'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { LinkIcon, MicIcon, PaperclipIcon, PenLineIcon, StickyNoteIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useDrafts } from '@/hooks/use-drafts'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface NewPostDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface CreateOption {
    icon: React.ReactNode
    title: string
    description: string
    enabled: boolean
    action?: () => void
}

export function NewPostDialog({ open, onOpenChange }: NewPostDialogProps) {
    const router = useRouter()
    const { createDraft } = useDrafts()

    const handleBlankPost = async () => {
        try {
            const draft = await createDraft()
            onOpenChange(false)
            router.push(`/dashboard/editor?draft=${draft.id}`)
        } catch {
            toast.error('Failed to create draft')
        }
    }

    const options: CreateOption[] = [
        {
            icon: <PenLineIcon className='size-5' />,
            title: 'Blank',
            description: 'Start from scratch',
            enabled: true,
            action: handleBlankPost,
        },
        {
            icon: <StickyNoteIcon className='size-5' />,
            title: 'Generate from notes',
            description: 'Paste text or ideas',
            enabled: false,
        },
        {
            icon: <MicIcon className='size-5' />,
            title: 'Generate from voice',
            description: 'Record a voice memo',
            enabled: false,
        },
        {
            icon: <PaperclipIcon className='size-5' />,
            title: 'Generate from file',
            description: 'Upload audio, video, or document',
            enabled: false,
        },
        {
            icon: <LinkIcon className='size-5' />,
            title: 'Generate from URL',
            description: 'Blog post or webpage',
            enabled: false,
        },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Create a new post</DialogTitle>
                    <DialogDescription>Choose how you want to start</DialogDescription>
                </DialogHeader>
                <div className='flex flex-col gap-1 pt-2'>
                    {options.map((option) => (
                        <button
                            key={option.title}
                            type='button'
                            disabled={!option.enabled}
                            onClick={option.action}
                            className='hover:bg-accent flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50'>
                            <div className='text-muted-foreground'>{option.icon}</div>
                            <div className='flex-1'>
                                <div className='flex items-center gap-2'>
                                    <span className='text-sm font-medium'>{option.title}</span>
                                    {!option.enabled && (
                                        <Badge variant='secondary' className='px-1.5 py-0 text-[10px]'>
                                            Soon
                                        </Badge>
                                    )}
                                </div>
                                <p className='text-muted-foreground text-xs'>{option.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
