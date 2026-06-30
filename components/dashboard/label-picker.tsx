'use client'

import { POST_FORMATS } from '@/lib/drafts'
import { labelColor } from '@/lib/status-styles'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export { labelColor }

type LabelPickerProps = {
    'value': string | null
    'onChange': (label: string | null) => void
    'className'?: string
    'aria-label'?: string
}

export function LabelPicker({ value, onChange, className, 'aria-label': ariaLabel }: LabelPickerProps) {
    return (
        <Select value={value ?? '__none__'} onValueChange={(v) => onChange(v === '__none__' ? null : v)}>
            <SelectTrigger aria-label={ariaLabel} className={cn('w-48', className)}>
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
