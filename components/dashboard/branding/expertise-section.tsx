'use client'

import * as React from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { type SectionProps } from './types'

export function ExpertiseSection({ branding, onUpdate }: SectionProps) {
    const [input, setInput] = React.useState('')
    const topics = branding.expertise.topics.filter(Boolean)

    const addTopic = () => {
        const trimmed = input.trim()
        if (!trimmed) return
        onUpdate({ expertise: { topics: [...topics, trimmed] } })
        setInput('')
    }

    const removeTopic = (index: number) => {
        const updated = topics.filter((_, i) => i !== index)
        onUpdate({ expertise: { topics: updated } })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Areas of Expertise</CardTitle>
                <CardDescription>Topics you write about on LinkedIn</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
                {topics.map((topic, i) => (
                    <div key={i} className='flex items-center gap-2 rounded-md border px-3 py-2'>
                        <span className='flex-1 text-sm'>{topic}</span>
                        <Button variant='ghost' size='icon' className='size-7' onClick={() => removeTopic(i)}>
                            <Trash2Icon className='size-3.5' />
                        </Button>
                    </div>
                ))}
                <div className='flex gap-0'>
                    <Input
                        placeholder='e.g. Create Mobile Apps'
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                        className='rounded-r-none'
                    />
                    <Button
                        variant='outline'
                        onClick={addTopic}
                        disabled={!input.trim()}
                        className='rounded-l-none border-l-0'>
                        <PlusIcon className='size-4' />
                        Add
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
