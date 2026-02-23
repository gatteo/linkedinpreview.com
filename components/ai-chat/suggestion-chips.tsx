interface SuggestionChipsProps {
    suggestions: string[]
    loading: boolean
    onSelect: (text: string) => void
}

function SkeletonChip({ width }: { width: string }) {
    return <div className={`h-7 animate-pulse rounded-full bg-muted ${width}`} />
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
                    key={suggestion}
                    type='button'
                    onClick={() => onSelect(suggestion)}
                    className='rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'>
                    {suggestion}
                </button>
            ))}
        </div>
    )
}
