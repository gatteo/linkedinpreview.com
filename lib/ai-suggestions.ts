import { ApiRoutes } from '@/config/routes'

export type SuggestionType = 'content' | 'structure' | 'tone' | 'engagement'

export interface Suggestion {
    text: string
    type: SuggestionType
}

export async function fetchSuggestions(postText: string): Promise<Suggestion[]> {
    try {
        const res = await fetch(ApiRoutes.Suggestions, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postText }),
        })

        if (!res.ok) return []

        const data = (await res.json()) as { suggestions?: Suggestion[] }
        return data.suggestions ?? []
    } catch {
        return []
    }
}
