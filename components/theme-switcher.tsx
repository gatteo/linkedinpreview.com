'use client'

import * as React from 'react'
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from '@/lib/utils'

const OPTIONS = [
    { value: 'light', label: 'Light theme', icon: SunIcon },
    { value: 'dark', label: 'Dark theme', icon: MoonIcon },
    { value: 'system', label: 'System theme', icon: MonitorIcon },
] as const

export function ThemeSwitcher({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => setMounted(true), [])

    return (
        <div
            role='radiogroup'
            aria-label='Theme'
            className={cn('border-border inline-flex items-center gap-0.5 rounded-full border p-0.5', className)}>
            {OPTIONS.map(({ value, label, icon: Icon }) => {
                const active = mounted && theme === value
                return (
                    <button
                        key={value}
                        type='button'
                        role='radio'
                        aria-checked={active}
                        aria-label={label}
                        title={label}
                        onClick={() => setTheme(value)}
                        className={cn(
                            'flex size-6.5 items-center justify-center rounded-full transition-colors',
                            active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
                        )}>
                        <Icon className='size-3.5' />
                    </button>
                )
            })}
        </div>
    )
}
