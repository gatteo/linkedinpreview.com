'use client'

import { POST_FORMATS } from '@/lib/drafts'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function labelColor(label: string): string {
    const colors: Record<string, string> = {
        'Personal Milestones': 'bg-blue-500',
        'Mindset & Motivation': 'bg-purple-500',
        'Career Before & After': 'bg-green-500',
        'Tool & Resource Insights': 'bg-orange-500',
        'Case Studies': 'bg-cyan-500',
        'Actionable Guides': 'bg-emerald-500',
        'Culture Moments': 'bg-pink-500',
        'Offer Highlight': 'bg-amber-500',
        'Client Success Story': 'bg-teal-500',
    }
    return colors[label] ?? 'bg-gray-500'
}

type LabelPickerProps = {
    value: string | null
    onChange: (label: string | null) => void
    className?: string
}

export function LabelPicker({ value, onChange, className }: LabelPickerProps) {
    return (
        <Select value={value ?? '__none__'} onValueChange={(v) => onChange(v === '__none__' ? null : v)}>
            <SelectTrigger className={cn('w-48', className)}>
                {value ? (
                    <div className='flex items-center gap-1.5'>
                        <div className={cn('size-2 shrink-0 rounded-full', labelColor(value))} />
                        <span className='truncate'>{value}</span>
                    </div>
                ) : (
                    <SelectValue placeholder='No format' />
                )}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value='__none__'>
                    <span className='text-muted-foreground'>No format</span>
                </SelectItem>
                {POST_FORMATS.map((label) => (
                    <SelectItem key={label} value={label}>
                        <div className='flex items-center gap-1.5'>
                            <div className={cn('size-2 shrink-0 rounded-full', labelColor(label))} />
                            <span>{label}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
