'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type VariantPickerProps = {
    variants: Array<{ text: string; wordCount: number; label?: string }>
    onSelect: (variant: { text: string; wordCount: number; label?: string }) => void
}

export function VariantPicker({ variants, onSelect }: VariantPickerProps) {
    return (
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {variants.map((variant, i) => (
                <div key={i} className='flex flex-col gap-3 rounded-lg border p-3'>
                    <div className='max-h-72 overflow-y-auto'>
                        <p className='text-sm leading-relaxed whitespace-pre-wrap'>{variant.text}</p>
                    </div>
                    <div className='flex items-center justify-between gap-2'>
                        <div className='flex flex-wrap gap-1.5'>
                            <Badge variant='secondary'>{variant.wordCount}w</Badge>
                            {variant.label && <Badge variant='outline'>{variant.label}</Badge>}
                        </div>
                        <Button size='sm' onClick={() => onSelect(variant)}>
                            Use this
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
