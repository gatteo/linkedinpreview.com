'use client'

import * as React from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { type SectionProps } from './types'

export function InspirationCreatorsSection({ branding, onUpdate }: SectionProps) {
    const [name, setName] = React.useState('')
    const [url, setUrl] = React.useState('')
    const creators = branding.inspiration?.creators ?? []

    const addCreator = () => {
        const trimmedName = name.trim()
        if (!trimmedName) return
        onUpdate({
            inspiration: {
                ...branding.inspiration,
                creators: [...creators, { name: trimmedName, url: url.trim() }],
            },
        })
        setName('')
        setUrl('')
    }

    const removeCreator = (index: number) => {
        onUpdate({
            inspiration: {
                ...branding.inspiration,
                creators: creators.filter((_, i) => i !== index),
            },
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Inspirational Creators</CardTitle>
                <CardDescription>Creators whose writing style inspires you</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
                {creators.map((creator, i) => (
                    <div key={i} className='flex items-center gap-2 rounded-md border px-3 py-2'>
                        <span className='flex-1 text-sm'>{creator.name}</span>
                        {creator.url && (
                            <a
                                href={creator.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-muted-foreground text-xs hover:underline'>
                                Profile
                            </a>
                        )}
                        <Button variant='ghost' size='icon' className='size-7' onClick={() => removeCreator(i)}>
                            <Trash2Icon className='size-3.5' />
                        </Button>
                    </div>
                ))}
                <div className='flex gap-2'>
                    <Input
                        placeholder='Creator name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCreator())}
                        className='flex-1'
                    />
                    <Input
                        placeholder='LinkedIn URL (optional)'
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCreator())}
                        className='flex-1'
                    />
                    <Button variant='outline' onClick={addCreator} disabled={!name.trim()}>
                        <PlusIcon className='size-4' />
                        Add
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
