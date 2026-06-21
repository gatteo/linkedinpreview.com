'use client'

import { BarChart3Icon, PencilLineIcon, TrendingUpIcon, UploadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { ImportLinkedInButton } from './import-linkedin-button'

type AnalyticsEmptyProps = {
    onImport: () => void
}

const BENEFITS = [
    { icon: TrendingUpIcon, text: 'Track impressions and engagement across all your posts' },
    { icon: BarChart3Icon, text: 'See which formats, lengths, and days perform best' },
    { icon: PencilLineIcon, text: 'Enter metrics by hand or import a LinkedIn CSV export' },
]

export function AnalyticsEmpty({ onImport }: AnalyticsEmptyProps) {
    return (
        <div className='flex flex-1 flex-col items-center justify-center p-8'>
            <div className='flex w-full max-w-sm flex-col items-center gap-8 text-center'>
                <div className='relative flex size-32 items-center justify-center'>
                    <div className='border-primary/8 absolute size-32 rounded-full border-2' />
                    <div className='border-primary/15 absolute size-24 rounded-full border-2' />
                    <div className='border-primary/25 absolute size-16 rounded-full border-2' />
                    <div className='bg-primary/10 flex size-10 items-center justify-center rounded-full'>
                        <BarChart3Icon className='text-primary size-5' />
                    </div>
                </div>

                <div className='space-y-2'>
                    <h2 className='text-2xl font-bold'>No published posts yet</h2>
                    <p className='text-muted-foreground text-sm'>
                        Once you publish posts, your performance analytics will appear here. Mark a post as published
                        (or publish through LinkedIn) to get started.
                    </p>
                </div>

                <ul className='w-full space-y-3 text-left'>
                    {BENEFITS.map(({ icon: Icon, text }) => (
                        <li key={text} className='flex items-start gap-3'>
                            <div className='bg-primary/10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full'>
                                <Icon className='text-primary size-3.5' />
                            </div>
                            <span className='text-sm'>{text}</span>
                        </li>
                    ))}
                </ul>

                <div className='flex flex-col items-center gap-2'>
                    {/* Self-hides unless LinkedIn API import is available. */}
                    <ImportLinkedInButton />
                    <Button variant='outline' onClick={onImport}>
                        <UploadIcon className='mr-1.5 size-4' />
                        Import CSV
                    </Button>
                </div>
            </div>
        </div>
    )
}
