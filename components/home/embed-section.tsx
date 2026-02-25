'use client'

import React from 'react'
import { Check, ChevronDown, ChevronUp, Code } from 'lucide-react'
import { toast } from 'sonner'

import { Icons } from '../icon'
import { AnimateIn } from '../ui/animate-in'
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
        <section id='embed' className='border-t border-border bg-neutral-50/30'>
            <div className='px-6 py-20 md:py-28'>
                {/* Left-aligned header */}
                <AnimateIn className='mb-12'>
                    <div className='mb-6 flex size-12 items-center justify-center rounded-xl border border-border bg-white shadow-subtle'>
                        <Code className='size-6 text-neutral-600' />
                    </div>
                    <h2 className='font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
                        Embed on your website
                    </h2>
                    <p className='mt-3 max-w-[500px] text-lg text-neutral-500'>
                        Add the LinkedIn post preview tool to your own website and let your visitors format and preview
                        posts without leaving your site.
                    </p>
                </AnimateIn>

                <div className='w-full max-w-2xl space-y-3'>
                    <div className='relative overflow-hidden rounded-xl border border-border bg-white'>
                        <pre className='overflow-x-auto p-4 text-sm text-neutral-700'>
                            <code>{EMBED_SNIPPET}</code>
                        </pre>
                        <Button
                            variant='outline'
                            size='sm'
                            className='absolute right-3 top-3 rounded-lg bg-white'
                            onClick={handleCopy}>
                            {copied ? (
                                <Check className='mr-1.5 size-3.5' />
                            ) : (
                                <Icons.copy className='mr-1.5 size-3.5' />
                            )}
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>

                    <div className='flex'>
                        <Button
                            variant='ghost'
                            size='sm'
                            className='text-neutral-500'
                            onClick={() => setShowPreview((prev) => !prev)}>
                            {showPreview ? (
                                <ChevronUp className='mr-1.5 size-4' />
                            ) : (
                                <ChevronDown className='mr-1.5 size-4' />
                            )}
                            {showPreview ? 'Hide preview' : 'Show live preview'}
                        </Button>
                    </div>

                    {showPreview && (
                        <div className='overflow-hidden rounded-xl border border-border shadow-elevated'>
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
