'use client'

import React from 'react'

import { EditorPanel } from './editor-panel'
import { PreviewPanel } from './preview-panel'

export function Tool() {
    const [content, setContent] = React.useState<string>('')

    const handleContentChange = (reason: any) => {
        setContent(reason)
    }

    return (
        <section id='tool' className='container max-w-7xl py-16 md:py-24'>
            <div className='flex min-h-[520px] flex-1 rounded-sm border'>
                <div className='flex flex-1 flex-col'>
                    <EditorPanel onChange={handleContentChange} />
                </div>
                <div className='hidden w-full max-w-[600px] flex-1 flex-col border-l md:flex'>
                    <PreviewPanel content={content} />
                </div>
            </div>
        </section>
    )
}
