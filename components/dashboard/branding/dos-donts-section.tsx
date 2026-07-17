'use client'

import * as React from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { type SectionProps } from './types'

export function DosDontsSection({ branding, onUpdate }: SectionProps) {
    const [newDo, setNewDo] = React.useState('')
    const [newDont, setNewDont] = React.useState('')

    const addDo = () => {
        if (!newDo.trim()) return
        onUpdate({ dosDonts: { ...branding.dosDonts, dos: [...branding.dosDonts.dos, newDo.trim()] } })
        setNewDo('')
    }

    const removeDo = (index: number) => {
        const next = branding.dosDonts.dos.filter((_, i) => i !== index)
        onUpdate({ dosDonts: { ...branding.dosDonts, dos: next } })
    }

    const addDont = () => {
        if (!newDont.trim()) return
        onUpdate({ dosDonts: { ...branding.dosDonts, donts: [...branding.dosDonts.donts, newDont.trim()] } })
        setNewDont('')
    }

    const removeDont = (index: number) => {
        const next = branding.dosDonts.donts.filter((_, i) => i !== index)
        onUpdate({ dosDonts: { ...branding.dosDonts, donts: next } })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{"Do's and Don'ts"}</CardTitle>
                <CardDescription>Rules for AI to follow when generating content</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
                <div className='space-y-3'>
                    <Label>{"Do's"}</Label>
                    {branding.dosDonts.dos.length > 0 && (
                        <ul className='space-y-1.5'>
                            {branding.dosDonts.dos.map((item, i) => (
                                <li key={i} className='flex items-center gap-2 rounded-md border px-3 py-2'>
                                    <span className='flex-1 text-sm'>{item}</span>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='text-muted-foreground hover:text-foreground size-7 shrink-0'
                                        onClick={() => removeDo(i)}>
                                        <Trash2Icon className='size-3.5' />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className='flex gap-0'>
                        <Input
                            value={newDo}
                            onChange={(e) => setNewDo(e.target.value)}
                            placeholder='e.g. Always include a clear CTA'
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDo())}
                            className='rounded-r-none'
                        />
                        <Button
                            variant='outline'
                            onClick={addDo}
                            disabled={!newDo.trim()}
                            className='rounded-l-none border-l-0'>
                            <PlusIcon className='size-4' />
                            Add
                        </Button>
                    </div>
                </div>

                <div className='space-y-3'>
                    <Label>{"Don'ts"}</Label>
                    {branding.dosDonts.donts.length > 0 && (
                        <ul className='space-y-1.5'>
                            {branding.dosDonts.donts.map((item, i) => (
                                <li key={i} className='flex items-center gap-2 rounded-md border px-3 py-2'>
                                    <span className='flex-1 text-sm'>{item}</span>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='text-muted-foreground hover:text-foreground size-7 shrink-0'
                                        onClick={() => removeDont(i)}>
                                        <Trash2Icon className='size-3.5' />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className='flex gap-0'>
                        <Input
                            value={newDont}
                            onChange={(e) => setNewDont(e.target.value)}
                            placeholder='e.g. Never use corporate jargon'
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDont())}
                            className='rounded-r-none'
                        />
                        <Button
                            variant='outline'
                            onClick={addDont}
                            disabled={!newDont.trim()}
                            className='rounded-l-none border-l-0'>
                            <PlusIcon className='size-4' />
                            Add
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
