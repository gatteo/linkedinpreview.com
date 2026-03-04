export function scoreColor(score: number): string {
    if (score >= 70) return 'text-green-500'
    if (score >= 40) return 'text-amber-500'
    return 'text-red-500'
}

export function scoreBarColor(score: number): string {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
}

export function sentimentColor(s: string): string {
    if (s === 'positive') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (s === 'negative') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    return 'bg-muted text-muted-foreground'
}

export function suggestionTypeColor(type: string): string {
    switch (type) {
        case 'content':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        case 'structure':
            return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
        case 'tone':
            return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
        case 'engagement':
            return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
        default:
            return 'bg-muted text-muted-foreground'
    }
}

export function formatCategory(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
