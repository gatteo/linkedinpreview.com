'use client'

import React from 'react'
import { Check, Code2, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'
import { Eyebrow } from './_shared'
import { IllustrationTile } from './illustration-tile'

const EMBED_SNIPPET = `<iframe id="linkedin-preview" src="https://linkedinpreview.com/embed" width="100%" height="600" style="border:1px solid #e5e7eb;border-radius:8px" allow="clipboard-write"></iframe>
<script>window.addEventListener('message',function(e){if(e.data?.type==='linkedinpreview-resize')document.getElementById('linkedin-preview').height=e.data.height});</script>`

export function EmbedSection() {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(EMBED_SNIPPET)
        setCopied(true)
        toast.success('Copied embed script')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <section id='embed' className='border-border scroll-mt-[var(--header-height)] border-t'>
            <div className='max-w-content border-border mx-auto border-x'>
                <div className='relative grid items-center md:grid-cols-2'>
                    <div className='dot-grid pointer-events-none absolute inset-0 opacity-40' />
                    <div className='relative px-7 py-16'>
                        <AnimateIn>
                            <Eyebrow className='mb-3'>Embed this tool</Eyebrow>
                            <h2 className='font-heading text-[clamp(28px,3.6vw,40px)] leading-[1.1] font-bold tracking-[-0.025em]'>
                                Embed on your site.
                            </h2>
                            <p className='text-muted-foreground mt-4 max-w-[420px] text-base leading-relaxed'>
                                Add the LinkedIn post preview tool to your own website - let visitors format and preview
                                posts without leaving your site. Auto-resizing, no branding, one snippet.
                            </p>
                            <div className='mt-7'>
                                <Button onClick={handleCopy}>
                                    {copied ? <Check className='size-3.5' /> : <Copy className='size-3.5' />}
                                    {copied ? 'Copied!' : 'Copy embed code'}
                                </Button>
                            </div>
                        </AnimateIn>
                    </div>
                    <AnimateIn from='fade' delay={0.1} className='relative hidden p-7 md:block'>
                        <IllustrationTile src='/images/illustrations/sailboat.jpg' ratio='4 / 3' />
                        <div className='border-border bg-card absolute inset-x-14 bottom-14 overflow-hidden rounded-lg border shadow-[0_18px_40px_oklch(0.2_0.03_222_/_0.24)]'>
                            <div className='border-border bg-secondary flex items-center justify-between gap-2.5 border-b py-2 pr-2.5 pl-3.5'>
                                <span className='text-muted-foreground inline-flex items-center gap-1.5 font-mono text-[11px]'>
                                    <Code2 className='size-3.5' />
                                    embed.html
                                </span>
                                <Button variant='outline' size='sm' onClick={handleCopy}>
                                    {copied ? <Check className='size-3' /> : <Copy className='size-3' />}
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                            <pre className='no-scrollbar text-petrol-700 overflow-x-auto p-4 font-mono text-[11px] leading-[1.65]'>
                                <code>{EMBED_SNIPPET}</code>
                            </pre>
                        </div>
                    </AnimateIn>
                </div>
            </div>
        </section>
    )
}
