'use client'

import * as React from 'react'
import { Loader2Icon } from 'lucide-react'

import type { MetricValues } from '@/lib/analytics/metrics'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type MetricField = { key: keyof MetricValues; label: string }

// Ordered to match how LinkedIn presents a post's stats.
const FIELDS: MetricField[] = [
    { key: 'impressions', label: 'Impressions' },
    { key: 'reach', label: 'Unique reach' },
    { key: 'reactions', label: 'Reactions' },
    { key: 'comments', label: 'Comments' },
    { key: 'reshares', label: 'Reposts' },
    { key: 'saves', label: 'Saves' },
    { key: 'sends', label: 'Sends' },
    { key: 'linkClicks', label: 'Link clicks' },
    { key: 'follows', label: 'New followers' },
    { key: 'profileViews', label: 'Profile views' },
]

type MetricsEntryDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    initial: MetricValues
    hasExisting: boolean
    onSave: (values: MetricValues) => Promise<void>
    onRemove?: () => Promise<void>
}

function toInput(v: number | null): string {
    return v === null ? '' : String(v)
}

export function MetricsEntryDialog({
    open,
    onOpenChange,
    title,
    initial,
    hasExisting,
    onSave,
    onRemove,
}: MetricsEntryDialogProps) {
    const [draft, setDraft] = React.useState<Record<keyof MetricValues, string>>(() => mapToStrings(initial))
    const [saving, setSaving] = React.useState(false)
    const [removing, setRemoving] = React.useState(false)

    // Reset the form whenever a different post's dialog opens.
    React.useEffect(() => {
        if (open) setDraft(mapToStrings(initial))
    }, [open, initial])

    const handleSave = async () => {
        setSaving(true)
        try {
            await onSave(stringsToValues(draft))
            onOpenChange(false)
        } finally {
            setSaving(false)
        }
    }

    const handleRemove = async () => {
        if (!onRemove) return
        setRemoving(true)
        try {
            await onRemove()
            onOpenChange(false)
        } finally {
            setRemoving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Post performance</DialogTitle>
                    <DialogDescription className='line-clamp-2'>
                        Enter the numbers from LinkedIn for “{title}”. Leave a field blank if you don’t have it.
                    </DialogDescription>
                </DialogHeader>

                <div className='grid grid-cols-2 gap-3'>
                    {FIELDS.map((field) => (
                        <div key={field.key} className='space-y-1.5'>
                            <Label htmlFor={`metric-${field.key}`} className='text-xs'>
                                {field.label}
                            </Label>
                            <Input
                                id={`metric-${field.key}`}
                                type='number'
                                min={0}
                                inputMode='numeric'
                                placeholder='-'
                                value={draft[field.key]}
                                onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                            />
                        </div>
                    ))}
                </div>

                <DialogFooter className='gap-2 sm:justify-between'>
                    {hasExisting && onRemove ? (
                        <Button
                            type='button'
                            variant='ghost'
                            className='text-destructive hover:text-destructive'
                            onClick={handleRemove}
                            disabled={saving || removing}>
                            {removing ? <Loader2Icon className='size-4 animate-spin' /> : 'Remove'}
                        </Button>
                    ) : (
                        <span />
                    )}
                    <div className='flex gap-2'>
                        <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type='button' onClick={handleSave} disabled={saving || removing}>
                            {saving ? <Loader2Icon className='size-4 animate-spin' /> : 'Save'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function mapToStrings(values: MetricValues): Record<keyof MetricValues, string> {
    const out = {} as Record<keyof MetricValues, string>
    for (const field of FIELDS) out[field.key] = toInput(values[field.key])
    return out
}

function stringsToValues(draft: Record<keyof MetricValues, string>): MetricValues {
    const out = {} as MetricValues
    for (const field of FIELDS) {
        const raw = draft[field.key].trim()
        const n = raw === '' ? null : Number(raw)
        out[field.key] = n !== null && Number.isFinite(n) && n >= 0 ? Math.round(n) : null
    }
    return out
}
