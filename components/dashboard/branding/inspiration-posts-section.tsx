'use client'

import * as React from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

import { type SectionProps } from './types'

export function InspirationPostsSection({ branding, onUpdate }: SectionProps) {
    const [input, setInput] = React.useState('')
    const posts = branding.inspiration?.posts ?? []

    const addPost = () => {
        const trimmed = input.trim()
        if (!trimmed) return
        onUpdate({ inspiration: { ...branding.inspiration, posts: [...posts, trimmed] } })
        setInput('')
    }

    const removePost = (index: number) => {
        onUpdate({ inspiration: { ...branding.inspiration, posts: posts.filter((_, i) => i !== index) } })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Inspirational Posts</CardTitle>
                <CardDescription>Paste LinkedIn posts you admire - we will analyze the writing style</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
                {posts.map((post, i) => (
                    <div key={i} className='relative rounded-md border p-3'>
                        <p className='line-clamp-3 pr-8 text-sm'>{post}</p>
                        <Button
                            variant='ghost'
                            size='icon'
                            className='absolute top-2 right-2 size-7'
                            onClick={() => removePost(i)}>
                            <Trash2Icon className='size-3.5' />
                        </Button>
                    </div>
                ))}
                <div className='flex gap-0'>
                    <Textarea
                        placeholder='Paste a LinkedIn post...'
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className='min-h-20 rounded-r-none'
                    />
                    <Button
                        variant='outline'
                        onClick={addPost}
                        disabled={!input.trim()}
                        className='h-auto rounded-l-none border-l-0'>
                        <PlusIcon className='size-4' />
                        Add
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
