import { ApiRoutes } from '@/config/routes'

export async function fetchSuggestions(postText: string): Promise<string[]> {
    try {
        const res = await fetch(ApiRoutes.Suggestions, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postText }),
        })

        if (!res.ok) return []

        const data = (await res.json()) as { suggestions?: string[] }
        return data.suggestions ?? []
    } catch {
        return []
    }
}
