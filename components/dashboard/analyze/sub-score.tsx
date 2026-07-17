import { scoreBarColor, scoreColor } from '@/lib/analyze-utils'
import { cn } from '@/lib/utils'

export function SubScore({ label, score }: { label: string; score: number }) {
    return (
        <div className='flex items-center gap-2'>
            <span className='text-muted-foreground w-24 shrink-0 text-xs'>{label}</span>
            <div className='bg-muted h-1.5 flex-1 overflow-hidden rounded-full'>
                <div
                    className={cn('h-full rounded-full transition-all duration-500', scoreBarColor(score))}
                    style={{ width: `${score}%` }}
                />
            </div>
            <span className={cn('w-6 shrink-0 text-right text-xs font-medium tabular-nums', scoreColor(score))}>
                {score}
            </span>
        </div>
    )
}
