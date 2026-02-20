'use client'

import React from 'react'
import { Check, ChevronDown, ChevronUp, Code } from 'lucide-react'
import { toast } from 'sonner'

import { Icons } from '../icon'
import { Button } from '../ui/button'

const EMBED_SNIPPET = `<iframe id="linkedin-preview" src="https://linkedinpreview.com/embed" width="100%" height="600" style="border:1px solid #e5e7eb;border-radius:8px" allow="clipboard-write"></iframe>
<script>window.addEventListener('message',function(e){if(e.data?.type==='linkedinpreview-resize')document.getElementById('linkedin-preview').height=e.data.height});</script>`

export function EmbedSection() {
    const [copied, setCopied] = React.useState(false)
    const [showPreview, setShowPreview] = React.useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(EMBED_SNIPPET)
        setCopied(true)
        toast.success('Copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <section id='embed' className='w-full py-12 md:py-16 lg:py-24'>
            <div className='container flex flex-col items-center space-y-6 px-4 text-center md:px-6'>
                <Code className='size-10' />
                <h2 className='font-heading text-2xl sm:text-4xl md:text-5xl'>Embed on Your Website</h2>
                <p className='mx-auto max-w-[600px] text-balance text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'>
                    Add the LinkedIn post preview tool to your own website and let your visitors format and preview
                    posts without leaving your site.
                </p>

                <div className='w-full max-w-2xl space-y-3 text-left'>
                    <div className='relative rounded-lg border bg-muted'>
                        <pre className='overflow-x-auto p-4 text-sm'>
                            <code>{EMBED_SNIPPET}</code>
                        </pre>
                        <Button variant='outline' size='sm' className='absolute right-2 top-2' onClick={handleCopy}>
                            {copied ? <Check className='mr-1 size-4' /> : <Icons.copy className='mr-1 size-4' />}
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>

                    <Button
                        variant='ghost'
                        size='sm'
                        className='mx-auto flex items-center gap-1'
                        onClick={() => setShowPreview((prev) => !prev)}>
                        {showPreview ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}
                        {showPreview ? 'Hide preview' : 'Show live preview'}
                    </Button>

                    {showPreview && (
                        <div className='overflow-hidden rounded-lg border'>
                            <iframe
                                src='/embed'
                                width='100%'
                                height='600'
                                style={{ border: 'none' }}
                                allow='clipboard-write'
                                title='LinkedIn Post Preview embed'
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
