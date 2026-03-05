'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { type SectionProps } from './types'

export function ProfileSection({ branding, onUpdate }: SectionProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be under 2MB')
            return
        }
        const reader = new FileReader()
        reader.onload = (ev) => {
            const url = ev.target?.result as string
            onUpdate({ profile: { ...branding.profile, avatarUrl: url } })
        }
        reader.readAsDataURL(file)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Shown in the LinkedIn post preview</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='flex items-center gap-4'>
                    <Avatar className='size-16'>
                        <AvatarImage src={branding.profile.avatarUrl} />
                        <AvatarFallback className='text-lg'>
                            {branding.profile.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                    </Avatar>
                    <input
                        ref={fileInputRef}
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={handleAvatarUpload}
                    />
                    <div className='space-y-1'>
                        <Button variant='outline' size='sm' onClick={() => fileInputRef.current?.click()}>
                            Upload photo
                        </Button>
                        {branding.profile.avatarUrl && (
                            <Button
                                variant='ghost'
                                size='sm'
                                className='text-muted-foreground'
                                onClick={() => onUpdate({ profile: { ...branding.profile, avatarUrl: '' } })}>
                                Remove
                            </Button>
                        )}
                    </div>
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='branding-name'>Full name</Label>
                    <Input
                        id='branding-name'
                        value={branding.profile.name}
                        onChange={(e) => onUpdate({ profile: { ...branding.profile, name: e.target.value } })}
                        placeholder='Your full name'
                        className='max-w-sm'
                    />
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='branding-headline'>Headline</Label>
                    <Input
                        id='branding-headline'
                        value={branding.profile.headline}
                        onChange={(e) => onUpdate({ profile: { ...branding.profile, headline: e.target.value } })}
                        placeholder='e.g. Founder @ Company'
                    />
                </div>
            </CardContent>
        </Card>
    )
}
