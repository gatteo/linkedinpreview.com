import type { Suggestion } from '@/lib/ai-suggestions'

type SuggestionChipsProps = {
    suggestions: Suggestion[]
    loading: boolean
    onSelect: (text: string) => void
}

function SkeletonChip({ width }: { width: string }) {
    return <div className={`bg-muted h-7 animate-pulse rounded-full ${width}`} />
}

export function SuggestionChips({ suggestions, loading, onSelect }: SuggestionChipsProps) {
    if (loading) {
        return (
            <div className='flex flex-wrap gap-2'>
                <SkeletonChip width='w-28' />
                <SkeletonChip width='w-36' />
                <SkeletonChip width='w-32' />
            </div>
        )
    }

    if (suggestions.length === 0) return null

    return (
        <div className='flex flex-wrap gap-2'>
            {suggestions.map((suggestion) => (
                <button
                    key={suggestion.text}
                    type='button'
                    onClick={() => onSelect(suggestion.text)}
                    className='border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-full border px-3 py-1.5 text-xs transition-colors'>
                    {suggestion.text}
                </button>
            ))}
        </div>
    )
}
