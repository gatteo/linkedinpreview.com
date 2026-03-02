'use client'

import * as React from 'react'
import { CheckIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { type BrandingData, type BrandingRole } from '@/lib/branding'
import { cn } from '@/lib/utils'
import { useBranding } from '@/hooks/use-branding'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SectionProps {
    branding: BrandingData
    onUpdate: (updates: Partial<BrandingData>) => void
}

// ---------------------------------------------------------------------------
// Save indicator
// ---------------------------------------------------------------------------

function SaveIndicator({ visible }: { visible: boolean }) {
    return (
        <div
            className={cn(
                'text-muted-foreground flex items-center gap-1.5 text-xs transition-opacity duration-300',
                visible ? 'opacity-100' : 'opacity-0',
            )}>
            <CheckIcon className='size-3.5 text-green-500' />
            All changes saved
        </div>
    )
}

// ---------------------------------------------------------------------------
// Profile Section
// ---------------------------------------------------------------------------

function ProfileSection({ branding, onUpdate }: SectionProps) {
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

// ---------------------------------------------------------------------------
// Positioning Section
// ---------------------------------------------------------------------------

function PositioningSection({ branding, onUpdate }: SectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Positioning Statement</CardTitle>
                <CardDescription>
                    Guides AI content generation. Use the format: "I help [audience] achieve [outcome] by [method]"
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    value={branding.positioning.statement}
                    onChange={(e) => onUpdate({ positioning: { statement: e.target.value } })}
                    placeholder='I help startup founders grow their LinkedIn presence by sharing actionable growth strategies'
                    rows={3}
                />
            </CardContent>
        </Card>
    )
}

// ---------------------------------------------------------------------------
// Role Section
// ---------------------------------------------------------------------------

const ROLES: { value: BrandingRole; label: string }[] = [
    { value: 'founder', label: 'Founder / C-Level' },
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'team-lead', label: 'Team Lead' },
    { value: 'employee', label: 'Employee' },
    { value: 'creator', label: 'Creator' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'agency', label: 'Agency' },
]

function RoleSection({ branding, onUpdate }: SectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Role</CardTitle>
                <CardDescription>Helps AI tailor content style and topics</CardDescription>
            </CardHeader>
            <CardContent>
                <Select value={branding.role} onValueChange={(val) => onUpdate({ role: val as BrandingRole })}>
                    <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select your role' />
                    </SelectTrigger>
                    <SelectContent>
                        {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                                {r.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    )
}

// ---------------------------------------------------------------------------
// Expertise Section
// ---------------------------------------------------------------------------

function ExpertiseSection({ branding, onUpdate }: SectionProps) {
    const updateTopic = (index: number, value: string) => {
        const topics = [...branding.expertise.topics] as [string, string, string, string]
        topics[index] = value
        onUpdate({ expertise: { topics } })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Areas of Expertise</CardTitle>
                <CardDescription>The main topics you post about. First two are required.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
                {branding.expertise.topics.map((topic, i) => (
                    <div key={i} className='space-y-1.5'>
                        <Label htmlFor={`topic-${i}`}>
                            Topic {i + 1}
                            {i < 2 && <span className='text-muted-foreground ml-1'>*</span>}
                        </Label>
                        <Input
                            id={`topic-${i}`}
                            value={topic}
                            onChange={(e) => updateTopic(i, e.target.value)}
                            placeholder={
                                i === 0
                                    ? 'e.g. Growth Marketing'
                                    : i === 1
                                      ? 'e.g. SaaS Startups'
                                      : i === 2
                                        ? 'e.g. Product Strategy'
                                        : 'e.g. Leadership'
                            }
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

// ---------------------------------------------------------------------------
// Writing Style Section
// ---------------------------------------------------------------------------

const LANGUAGES = [
    { value: 'english', label: 'English' },
    { value: 'german', label: 'German' },
    { value: 'french', label: 'French' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'italian', label: 'Italian' },
    { value: 'portuguese', label: 'Portuguese' },
    { value: 'dutch', label: 'Dutch' },
]

function WritingStyleSection({ branding, onUpdate }: SectionProps) {
    const { writingStyle } = branding

    const update = (field: keyof typeof writingStyle, value: string) => {
        onUpdate({ writingStyle: { ...writingStyle, [field]: value } })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Writing Style</CardTitle>
                <CardDescription>Defines how AI generates and adapts content for you</CardDescription>
            </CardHeader>
            <CardContent className='space-y-5'>
                <div className='space-y-2'>
                    <Label>Language</Label>
                    <Select value={writingStyle.language} onValueChange={(val) => update('language', val)}>
                        <SelectTrigger className='w-full'>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map((l) => (
                                <SelectItem key={l.value} value={l.value}>
                                    {l.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className='space-y-2'>
                    <Label>Sentence length</Label>
                    <ToggleGroup
                        type='single'
                        variant='outline'
                        value={writingStyle.sentenceLength}
                        onValueChange={(val) => val && update('sentenceLength', val)}
                        className='w-full'>
                        <ToggleGroupItem value='short' className='flex-1'>
                            Short
                        </ToggleGroupItem>
                        <ToggleGroupItem value='standard' className='flex-1'>
                            Standard
                        </ToggleGroupItem>
                        <ToggleGroupItem value='long' className='flex-1'>
                            Long
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <div className='space-y-2'>
                    <Label>Post length</Label>
                    <ToggleGroup
                        type='single'
                        variant='outline'
                        value={writingStyle.postLength}
                        onValueChange={(val) => val && update('postLength', val)}
                        className='w-full'>
                        <ToggleGroupItem value='short' className='flex-1'>
                            Short
                        </ToggleGroupItem>
                        <ToggleGroupItem value='standard' className='flex-1'>
                            Standard
                        </ToggleGroupItem>
                        <ToggleGroupItem value='long' className='flex-1'>
                            Long
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <div className='space-y-2'>
                    <Label>Emoji frequency</Label>
                    <ToggleGroup
                        type='single'
                        variant='outline'
                        value={writingStyle.emojiFrequency}
                        onValueChange={(val) => val && update('emojiFrequency', val)}
                        className='w-full'>
                        <ToggleGroupItem value='none' className='flex-1'>
                            None
                        </ToggleGroupItem>
                        <ToggleGroupItem value='moderate' className='flex-1'>
                            Moderate
                        </ToggleGroupItem>
                        <ToggleGroupItem value='a-lot' className='flex-1'>
                            A lot
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </CardContent>
        </Card>
    )
}

// ---------------------------------------------------------------------------
// Footer Section
// ---------------------------------------------------------------------------

function FooterSection({ branding, onUpdate }: SectionProps) {
    const { footer } = branding

    return (
        <Card>
            <CardHeader>
                <CardTitle>Custom Footer</CardTitle>
                <CardDescription>Automatically append a signature or CTA to every generated post</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='flex items-center gap-3'>
                    <Switch
                        id='footer-enabled'
                        checked={footer.enabled}
                        onCheckedChange={(checked) => onUpdate({ footer: { ...footer, enabled: checked } })}
                    />
                    <Label htmlFor='footer-enabled' className='cursor-pointer'>
                        Enable custom footer
                    </Label>
                </div>
                {footer.enabled && (
                    <Textarea
                        value={footer.text}
                        onChange={(e) => onUpdate({ footer: { ...footer, text: e.target.value } })}
                        placeholder={
                            'e.g.\n\nFollow me for more tips on growing your LinkedIn presence.\n\n#LinkedIn #ContentMarketing'
                        }
                        rows={4}
                    />
                )}
            </CardContent>
        </Card>
    )
}

// ---------------------------------------------------------------------------
// Knowledge Base Section
// ---------------------------------------------------------------------------

function KnowledgeBaseSection({ branding, onUpdate }: SectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>
                    Extra context about you, your business, products, or audience. AI uses this when generating content.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    value={branding.knowledgeBase.notes}
                    onChange={(e) => onUpdate({ knowledgeBase: { notes: e.target.value } })}
                    placeholder={
                        'e.g. My company builds productivity software for remote teams. Our main product is TaskFlow, used by 10k+ companies. Our audience is mid-size SaaS companies with 50-500 employees...'
                    }
                    rows={6}
                />
            </CardContent>
        </Card>
    )
}

// ---------------------------------------------------------------------------
// Dos and Don'ts Section
// ---------------------------------------------------------------------------

function DosDontsSection({ branding, onUpdate }: SectionProps) {
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
                    <div className='flex gap-2'>
                        <Input
                            value={newDo}
                            onChange={(e) => setNewDo(e.target.value)}
                            placeholder='e.g. Always include a clear CTA'
                            onKeyDown={(e) => e.key === 'Enter' && addDo()}
                        />
                        <Button variant='outline' size='sm' onClick={addDo} disabled={!newDo.trim()}>
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
                    <div className='flex gap-2'>
                        <Input
                            value={newDont}
                            onChange={(e) => setNewDont(e.target.value)}
                            placeholder='e.g. Never use corporate jargon'
                            onKeyDown={(e) => e.key === 'Enter' && addDont()}
                        />
                        <Button variant='outline' size='sm' onClick={addDont} disabled={!newDont.trim()}>
                            <PlusIcon className='size-4' />
                            Add
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

function BrandingFormSkeleton() {
    return (
        <div className='mx-auto max-w-2xl space-y-6 p-4 lg:p-6'>
            <div className='flex items-start justify-between gap-4'>
                <div className='space-y-2'>
                    <Skeleton className='h-8 w-32' />
                    <Skeleton className='h-4 w-64' />
                </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className='space-y-4 rounded-xl border p-6'>
                    <Skeleton className='h-5 w-24' />
                    <Skeleton className='h-4 w-48' />
                    <Skeleton className='h-10 w-full' />
                </div>
            ))}
        </div>
    )
}

export function BrandingForm() {
    const { branding, isLoading, updateBranding } = useBranding()
    const [showSaved, setShowSaved] = React.useState(false)
    const savedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleUpdate = React.useCallback(
        (updates: Partial<BrandingData>) => {
            updateBranding(updates)
            setShowSaved(true)
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
            savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000)
        },
        [updateBranding],
    )

    React.useEffect(() => {
        return () => {
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
        }
    }, [])

    if (isLoading) return <BrandingFormSkeleton />

    return (
        <div className='mx-auto max-w-2xl space-y-6 p-4 lg:p-6'>
            <div className='flex items-start justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-semibold'>Branding</h1>
                    <p className='text-muted-foreground text-sm'>
                        Personalize your preview and guide AI content generation.
                    </p>
                </div>
                <SaveIndicator visible={showSaved} />
            </div>

            <ProfileSection branding={branding} onUpdate={handleUpdate} />
            <PositioningSection branding={branding} onUpdate={handleUpdate} />
            <RoleSection branding={branding} onUpdate={handleUpdate} />
            <ExpertiseSection branding={branding} onUpdate={handleUpdate} />
            <WritingStyleSection branding={branding} onUpdate={handleUpdate} />
            <FooterSection branding={branding} onUpdate={handleUpdate} />
            <KnowledgeBaseSection branding={branding} onUpdate={handleUpdate} />
            <DosDontsSection branding={branding} onUpdate={handleUpdate} />
        </div>
    )
}
