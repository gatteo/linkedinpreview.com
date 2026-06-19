'use client'

import * as React from 'react'

import type { BrandingWritingStyle } from '@/lib/branding'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { OnboardingAnswers } from '../types'

const LANGUAGES = [
    'english',
    'spanish',
    'french',
    'german',
    'italian',
    'portuguese',
    'dutch',
    'swedish',
    'polish',
] as const

const LOCALE_TO_LANGUAGE: Record<string, string> = {
    es: 'spanish',
    fr: 'french',
    de: 'german',
    it: 'italian',
    pt: 'portuguese',
    nl: 'dutch',
    sv: 'swedish',
    pl: 'polish',
}

const SCALES: {
    field: 'sentenceLength' | 'postLength' | 'emojiFrequency'
    label: string
    options: { value: string; label: string }[]
}[] = [
    {
        field: 'sentenceLength',
        label: 'Sentence length',
        options: [
            { value: 'short', label: 'Short & punchy' },
            { value: 'standard', label: 'Balanced' },
            { value: 'long', label: 'Detailed' },
        ],
    },
    {
        field: 'postLength',
        label: 'Post length',
        options: [
            { value: 'short', label: 'Concise' },
            { value: 'standard', label: 'Standard' },
            { value: 'long', label: 'In-depth' },
        ],
    },
    {
        field: 'emojiFrequency',
        label: 'Emoji use',
        options: [
            { value: 'none', label: 'None' },
            { value: 'moderate', label: 'A little' },
            { value: 'a-lot', label: 'Lots' },
        ],
    },
]

type WritingStyleStepProps = {
    answers: OnboardingAnswers
    update: (patch: Partial<OnboardingAnswers>) => void
}

export function WritingStyleStep({ answers, update }: WritingStyleStepProps) {
    const style = answers.writingStyle
    const setStyle = (patch: Partial<BrandingWritingStyle>) => update({ writingStyle: { ...style, ...patch } })

    // Default the language from the browser locale once, if still on the default.
    const seeded = React.useRef(false)
    React.useEffect(() => {
        if (seeded.current) return
        seeded.current = true
        if (style.language !== 'english') return
        const code = navigator.language?.slice(0, 2).toLowerCase()
        const mapped = code ? LOCALE_TO_LANGUAGE[code] : undefined
        if (mapped) setStyle({ language: mapped })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-1.5'>
                <Label htmlFor='ob-language'>Language</Label>
                <Select value={style.language} onValueChange={(v) => setStyle({ language: v })}>
                    <SelectTrigger id='ob-language' className='w-full capitalize'>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {LANGUAGES.map((lang) => (
                            <SelectItem key={lang} value={lang} className='capitalize'>
                                {lang}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {SCALES.map((scale) => (
                <div key={scale.field} className='flex flex-col gap-1.5'>
                    <Label>{scale.label}</Label>
                    <div className='grid grid-cols-3 gap-2'>
                        {scale.options.map((opt) => {
                            const selected = style[scale.field] === opt.value
                            return (
                                <button
                                    key={opt.value}
                                    type='button'
                                    onClick={() =>
                                        setStyle({ [scale.field]: opt.value } as Partial<BrandingWritingStyle>)
                                    }
                                    className={cn(
                                        'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                                        selected
                                            ? 'border-primary bg-primary/5 text-foreground'
                                            : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50',
                                    )}>
                                    {opt.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}
