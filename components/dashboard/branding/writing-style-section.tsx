import { InfoIcon } from 'lucide-react'

import { flagEmoji } from '@/lib/flag-emoji'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { type SectionProps } from './types'

const LANGUAGES = [
    { value: 'english', label: 'English', flag: 'us' },
    { value: 'german', label: 'German', flag: 'de' },
    { value: 'french', label: 'French', flag: 'fr' },
    { value: 'spanish', label: 'Spanish', flag: 'es' },
    { value: 'italian', label: 'Italian', flag: 'it' },
    { value: 'portuguese', label: 'Portuguese', flag: 'pt' },
    { value: 'dutch', label: 'Dutch', flag: 'nl' },
] as const

export function WritingStyleSection({ branding, onUpdate }: SectionProps) {
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
                        <SelectTrigger className='max-w-sm'>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map((l) => (
                                <SelectItem key={l.value} value={l.value}>
                                    <span className='mr-2'>{flagEmoji(l.flag)}</span>
                                    {l.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className='space-y-2'>
                    <div className='flex items-center gap-1.5'>
                        <Label>Sentence length</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <InfoIcon className='text-muted-foreground size-3.5' />
                                </TooltipTrigger>
                                <TooltipContent side='top' className='max-w-xs'>
                                    <p>
                                        Control the average length of each sentence. Short creates punchy, concise lines
                                        while Long uses a more academic, detailed writing style.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <ToggleGroup
                        type='single'
                        variant='outline'
                        value={writingStyle.sentenceLength}
                        onValueChange={(val) => val && update('sentenceLength', val)}
                        className='w-full gap-0'>
                        <ToggleGroupItem
                            value='short'
                            className='flex-1 rounded-none border first:rounded-l-md last:rounded-r-md'>
                            Short
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value='standard'
                            className='flex-1 rounded-none border first:rounded-l-md last:rounded-r-md'>
                            Standard
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value='long'
                            className='flex-1 rounded-none border first:rounded-l-md last:rounded-r-md'>
                            Long
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <div className='space-y-2'>
                    <div className='flex items-center gap-1.5'>
                        <Label>Post length</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <InfoIcon className='text-muted-foreground size-3.5' />
                                </TooltipTrigger>
                                <TooltipContent side='top' className='max-w-xs'>
                                    <p>
                                        Set the target length for your posts. Short posts are under 500 characters,
                                        Standard is 500-1500, Long is 1500+.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <ToggleGroup
                        type='single'
                        variant='outline'
                        value={writingStyle.postLength}
                        onValueChange={(val) => val && update('postLength', val)}
                        className='w-full gap-0'>
                        <ToggleGroupItem
                            value='short'
                            className='flex-1 rounded-none border first:rounded-l-md last:rounded-r-md'>
                            Short
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value='standard'
                            className='flex-1 rounded-none border first:rounded-l-md last:rounded-r-md'>
                            Standard
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value='long'
                            className='flex-1 rounded-none border first:rounded-l-md last:rounded-r-md'>
                            Long
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <div className='space-y-2'>
                    <div className='flex items-center gap-1.5'>
                        <Label>Emoji frequency</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <InfoIcon className='text-muted-foreground size-3.5' />
                                </TooltipTrigger>
                                <TooltipContent side='top' className='max-w-xs'>
                                    <p>
                                        How often emojis appear in your posts. None keeps it clean, Moderate adds
                                        occasional emphasis, A lot uses them liberally.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <ToggleGroup
                        type='single'
                        variant='outline'
                        value={writingStyle.emojiFrequency}
                        onValueChange={(val) => val && update('emojiFrequency', val)}
                        className='w-full gap-0'>
                        <ToggleGroupItem
                            value='none'
                            className='flex-1 rounded-none border first:rounded-l-md last:rounded-r-md'>
                            None
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value='moderate'
                            className='flex-1 rounded-none border first:rounded-l-md last:rounded-r-md'>
                            Moderate
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value='a-lot'
                            className='flex-1 rounded-none border first:rounded-l-md last:rounded-r-md'>
                            A lot
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </CardContent>
        </Card>
    )
}
