'use client'

import * as React from 'react'
import { FileTextIcon, LinkIcon, MicIcon, NotebookPenIcon, UploadIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type SourceType = 'notes' | 'voice' | 'file' | 'url'

type SourceOption = {
    id: SourceType | 'blank'
    icon: React.ReactNode
    title: string
    description: string
}

const SOURCE_OPTIONS: SourceOption[] = [
    {
        id: 'blank',
        icon: <FileTextIcon className='size-5' />,
        title: 'Blank post',
        description: 'Start with a blank post',
    },
    {
        id: 'notes',
        icon: <NotebookPenIcon className='size-5' />,
        title: 'Notes',
        description: 'Write from notes or ideas',
    },
    {
        id: 'voice',
        icon: <MicIcon className='size-5' />,
        title: 'Voice',
        description: 'Speak your thoughts',
    },
    {
        id: 'file',
        icon: <UploadIcon className='size-5' />,
        title: 'File',
        description: 'Import from a file',
    },
    {
        id: 'url',
        icon: <LinkIcon className='size-5' />,
        title: 'URL',
        description: 'Extract from a URL',
    },
]

type SourcePickerProps = {
    onSelect: (source: SourceType | 'blank') => void
}

export function SourcePicker({ onSelect }: SourcePickerProps) {
    return (
        <div className='flex flex-col gap-1'>
            {SOURCE_OPTIONS.map((option) => (
                <button
                    key={option.id}
                    type='button'
                    onClick={() => onSelect(option.id)}
                    className={cn(
                        'hover:bg-accent focus-visible:ring-ring flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                        'focus-visible:ring-2 focus-visible:outline-none',
                    )}>
                    <div className='text-muted-foreground'>{option.icon}</div>
                    <div className='flex-1'>
                        <p className='text-sm font-medium'>{option.title}</p>
                        <p className='text-muted-foreground text-xs'>{option.description}</p>
                    </div>
                </button>
            ))}
        </div>
    )
}
