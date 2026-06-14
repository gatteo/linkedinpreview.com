'use client'

import { STATUS_OPTIONS, type DraftStatus } from '@/lib/drafts'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type StatusPickerProps = {
    'value': DraftStatus
    'onChange': (status: DraftStatus) => void
    'className'?: string
    'aria-label'?: string
}

export function StatusPicker({ value, onChange, className, 'aria-label': ariaLabel }: StatusPickerProps) {
    return (
        <Select value={value} onValueChange={(v) => onChange(v as DraftStatus)}>
            <SelectTrigger aria-label={ariaLabel ?? 'Post status'} className={cn('w-36', className)}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        Status: {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
