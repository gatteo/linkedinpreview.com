'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

import { Icons } from '../icon'
import { AnimateIn } from '../ui/animate-in'
import { Button } from '../ui/button'

const EMBED_SNIPPET = `<iframe id="linkedin-preview" src="https://linkedinpreview.com/embed" width="100%" height="600" style="border:1px solid #e5e7eb;border-radius:8px" allow="clipboard-write"></iframe>
<script>window.addEventListener('message',function(e){if(e.data?.type==='linkedinpreview-resize')document.getElementById('linkedin-preview').height=e.data.height});</script>`

function BlueprintEmbed() {
    return (
        <svg viewBox='0 0 400 300' fill='none' xmlns='http://www.w3.org/2000/svg' className='size-full'>
            {/* Browser window outline */}
            <rect x='40' y='30' width='320' height='220' rx='8' stroke='currentColor' strokeWidth='1.5' opacity='0.5' />

            {/* Dashed offset (blueprint depth) */}
            <rect
                x='43'
                y='33'
                width='320'
                height='220'
                rx='8'
                stroke='currentColor'
                strokeWidth='0.6'
                strokeDasharray='6 4'
                opacity='0.15'
            />

            {/* Title bar */}
            <line x1='40' y1='62' x2='360' y2='62' stroke='currentColor' strokeWidth='1' opacity='0.3' />

            {/* Window dots */}
            <circle cx='60' cy='46' r='4' stroke='currentColor' strokeWidth='1' opacity='0.3' />
            <circle cx='76' cy='46' r='4' stroke='currentColor' strokeWidth='1' opacity='0.3' />
            <circle cx='92' cy='46' r='4' stroke='currentColor' strokeWidth='1' opacity='0.3' />

            {/* URL bar */}
            <rect
                x='120'
                y='38'
                width='160'
                height='16'
                rx='4'
                stroke='currentColor'
                strokeWidth='0.75'
                opacity='0.2'
                strokeDasharray='4 3'
            />

            {/* Code brackets </> */}
            <path
                d='M165 125 L140 148 L165 171'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                opacity='0.45'
            />
            <path
                d='M235 125 L260 148 L235 171'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                opacity='0.45'
            />
            <line
                x1='210'
                y1='118'
                x2='190'
                y2='178'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                opacity='0.35'
            />

            {/* Content placeholder lines */}
            <line
                x1='100'
                y1='205'
                x2='240'
                y2='205'
                stroke='currentColor'
                strokeWidth='1'
                strokeDasharray='4 3'
                opacity='0.18'
            />
            <line
                x1='100'
                y1='218'
                x2='200'
                y2='218'
                stroke='currentColor'
                strokeWidth='1'
                strokeDasharray='4 3'
                opacity='0.13'
            />

            {/* Dimension ticks */}
            <line x1='40' y1='262' x2='40' y2='274' stroke='currentColor' strokeWidth='0.5' opacity='0.2' />
            <line x1='360' y1='262' x2='360' y2='274' stroke='currentColor' strokeWidth='0.5' opacity='0.2' />
            <line
                x1='40'
                y1='270'
                x2='360'
                y2='270'
                stroke='currentColor'
                strokeWidth='0.5'
                strokeDasharray='4 3'
                opacity='0.15'
            />

            {/* Annotation dots at corners */}
            <circle cx='40' cy='30' r='2' fill='currentColor' opacity='0.2' />
            <circle cx='360' cy='30' r='2' fill='currentColor' opacity='0.2' />
            <circle cx='40' cy='250' r='2' fill='currentColor' opacity='0.2' />
            <circle cx='360' cy='250' r='2' fill='currentColor' opacity='0.2' />
        </svg>
    )
}

export function EmbedSection() {
    const [copied, setCopied] = React.useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(EMBED_SNIPPET)
        setCopied(true)
        toast.success('Copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <section id='embed' className='border-border border-t'>
            <AnimateIn>
                <div className='relative grid items-center overflow-hidden md:grid-cols-2'>
                    {/* Blueprint grid background */}
                    <div
                        className='pointer-events-none absolute inset-0'
                        style={{
                            backgroundImage: [
                                'linear-gradient(to right, var(--color-border) 0.5px, transparent 0.5px)',
                                'linear-gradient(to bottom, var(--color-border) 0.5px, transparent 0.5px)',
                            ].join(', '),
                            backgroundSize: '80px 80px',
                            opacity: 0.4,
                        }}
                    />
                    {/* Dashed inner divider */}
                    <div
                        className='pointer-events-none absolute top-0 bottom-0 left-1/2 hidden md:block'
                        style={{
                            width: '1px',
                            backgroundImage:
                                'repeating-linear-gradient(0deg, var(--color-border) 0 4px, transparent 4px 10px)',
                        }}
                    />

                    {/* Left: Copy + Snippet */}
                    <div className='relative z-10 min-w-0 px-6 py-16 md:py-24 lg:py-28'>
                        <p className='text-primary mb-2 text-sm font-semibold tracking-wider uppercase'>
                            Embed This Tool
                        </p>
                        <h2 className='font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl md:text-[2.75rem] md:leading-[1.15]'>
                            Embed on your site.
                        </h2>
                        <p className='mt-4 max-w-md text-base leading-relaxed text-neutral-500'>
                            Add the LinkedIn post preview tool to your own website - let visitors format and preview
                            posts without leaving your site.
                        </p>
                        <div className='border-border relative mt-8 max-w-md overflow-hidden rounded-lg border bg-white'>
                            <pre className='no-scrollbar overflow-x-auto p-3 pr-24 text-xs leading-relaxed text-neutral-600'>
                                <code>{EMBED_SNIPPET}</code>
                            </pre>
                            <Button
                                variant='outline'
                                size='sm'
                                className='absolute top-2.5 right-2.5 bg-white'
                                onClick={handleCopy}>
                                {copied ? (
                                    <Check className='mr-1.5 size-3.5' />
                                ) : (
                                    <Icons.copy className='mr-1.5 size-3.5' />
                                )}
                                {copied ? 'Copied' : 'Copy'}
                            </Button>
                        </div>
                    </div>

                    {/* Right: Blueprint embed illustration */}
                    <div className='relative z-10 hidden items-center justify-center px-6 py-12 text-neutral-900 md:flex md:py-24'>
                        <div className='w-full max-w-[380px]'>
                            <BlueprintEmbed />
                        </div>
                    </div>
                </div>
            </AnimateIn>
        </section>
    )
}
