'use client'

import type { StrategyFormat } from '@/lib/strategy'
import { cn } from '@/lib/utils'

type FormatTargetsProps = {
    formats: StrategyFormat[]
    monthlyTarget: number
    postsByFormat: Record<string, number>
}

export function FormatTargets({ formats, monthlyTarget, postsByFormat }: FormatTargetsProps) {
    const enabledFormats = formats.filter((f) => f.enabled)
    const targetPerFormat =
        enabledFormats.length > 0 ? Math.max(1, Math.round(monthlyTarget / enabledFormats.length)) : 1

    return (
        <div>
            <div className='mb-3 flex items-center justify-between'>
                <p className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                    Post Format Targets
                </p>
                <span className='text-muted-foreground text-xs'>
                    {enabledFormats.length} of {formats.length} formats
                </span>
            </div>

            {enabledFormats.length === 0 ? (
                <p className='text-muted-foreground text-sm italic'>No formats enabled.</p>
            ) : (
                <ul className='space-y-3'>
                    {enabledFormats.map((format) => {
                        const count = postsByFormat[format.name] ?? 0
                        const pct = Math.min(100, Math.round((count / targetPerFormat) * 100))

                        return (
                            <li key={format.name}>
                                <div className='mb-1 flex items-center justify-between'>
                                    <span className='text-sm'>{format.name}</span>
                                    <span className='text-muted-foreground text-xs'>
                                        {count}/{targetPerFormat}
                                    </span>
                                </div>
                                <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all duration-300',
                                            pct >= 100 ? 'bg-green-500' : 'bg-primary',
                                        )}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
