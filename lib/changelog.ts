import { allChangelogs } from 'contentlayer/generated'

export type ChangelogEntry = {
    slug: string
    title: string
    date: Date
    summary: string
    image?: string
    body: {
        code: string
        raw: string
    }
}

export function getAllChangelogs(): ChangelogEntry[] {
    return allChangelogs
        .sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)))
        .map((entry) => ({
            slug: entry.slug,
            title: entry.title,
            date: new Date(entry.date),
            summary: entry.summary,
            image: entry.image,
            body: entry.body,
        }))
}
