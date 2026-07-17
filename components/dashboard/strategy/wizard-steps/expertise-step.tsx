'use client'

import { Input } from '@/components/ui/input'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExpertiseStepProps = {
    value: string[]
    onChange: (value: string[]) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOPIC_CONFIGS = [
    { label: 'Topic 1', required: true, placeholder: 'e.g. Entrepreneurship' },
    { label: 'Topic 2', required: true, placeholder: 'e.g. Product Strategy' },
    { label: 'Topic 3', required: false, placeholder: 'e.g. B2B SaaS Growth' },
    { label: 'Topic 4', required: false, placeholder: 'e.g. Leadership' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExpertiseStep({ value, onChange }: ExpertiseStepProps) {
    const handleChange = (index: number, text: string) => {
        const next = [...value]
        next[index] = text
        onChange(next)
    }

    return (
        <div className='grid w-full grid-cols-2 gap-4'>
            {TOPIC_CONFIGS.map((config, index) => (
                <div key={index} className='flex flex-col gap-1.5'>
                    <label className='text-sm font-medium'>
                        {config.label}
                        {config.required && <span className='text-destructive ml-0.5'>*</span>}
                    </label>
                    <Input
                        value={value[index] ?? ''}
                        onChange={(e) => handleChange(index, e.target.value)}
                        placeholder={config.placeholder}
                    />
                </div>
            ))}
        </div>
    )
}
