'use client'

import React from 'react'
import { Eye, PenLine } from 'lucide-react'

import { cn } from '@/lib/utils'

import { EditorPanel } from './editor-panel'
import { PreviewPanel } from './preview/preview-panel'

type ToolProps = {
    variant?: 'default' | 'embed'
}

type MobileTab = 'editor' | 'preview'

export function Tool({ variant = 'default' }: ToolProps) {
    const [content, setContent] = React.useState<any>(null)
    const [image, setImage] = React.useState<string | null>(null)
    const [mobileTab, setMobileTab] = React.useState<MobileTab>('editor')

    const handleContentChange = (json: any) => {
        setContent(json)
    }

    const handleImageChange = (imageSrc: string | null) => {
        setImage(imageSrc)
    }

    const inner = (
        <div
            className={cn(
                'flex min-h-[520px] flex-1 flex-col rounded-sm border',
                variant === 'embed' && 'h-full border-0',
            )}>
            {/* Mobile tab bar — hidden on desktop where both panels are visible */}
            <div className='flex border-b md:hidden'>
                <button
                    type='button'
                    onClick={() => setMobileTab('editor')}
                    className={cn(
                        'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                        mobileTab === 'editor'
                            ? 'border-b-2 border-foreground text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    )}>
                    <PenLine className='size-4' />
                    Editor
                </button>
                <button
                    type='button'
                    onClick={() => setMobileTab('preview')}
                    className={cn(
                        'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                        mobileTab === 'preview'
                            ? 'border-b-2 border-foreground text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    )}>
                    <Eye className='size-4' />
                    Preview
                </button>
            </div>

            {/* Panels — on mobile only the active tab is visible; on desktop both show side-by-side */}
            <div className='flex flex-1'>
                <div className={cn('min-w-0 flex-1 flex-col', mobileTab === 'editor' ? 'flex' : 'hidden md:flex')}>
                    <EditorPanel onChange={handleContentChange} onImageChange={handleImageChange} />
                </div>
                <div
                    className={cn(
                        'w-full flex-1 flex-col md:max-w-[600px] md:border-l',
                        mobileTab === 'preview' ? 'flex' : 'hidden md:flex',
                    )}>
                    <PreviewPanel content={content} image={image} />
                </div>
            </div>
        </div>
    )

    if (variant === 'embed') {
        return inner
    }

    return (
        <section id='tool' className='container max-w-7xl py-16 md:py-24'>
            {inner}
        </section>
    )
}
