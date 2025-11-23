'use client'

import React from 'react'

import { EditorPanel } from './editor-panel'
import { PreviewPanel } from './preview/preview-panel'

export function Tool() {
    const [content, setContent] = React.useState<any>(null)
    const [image, setImage] = React.useState<string | null>(null)

    const handleContentChange = (json: any) => {
        setContent(json)
    }

    const handleImageChange = (imageSrc: string | null) => {
        setImage(imageSrc)
    }

    return (
        <section id='tool' className='container max-w-7xl py-16 md:py-24'>
            <div className='flex min-h-[520px] flex-1 rounded-sm border'>
                <div className='flex flex-1 flex-col'>
                    <EditorPanel onChange={handleContentChange} onImageChange={handleImageChange} />
                </div>
                <div className='hidden w-full max-w-[600px] flex-1 flex-col border-l md:flex'>
                    <PreviewPanel content={content} image={image} />
                </div>
            </div>
        </section>
    )
}
