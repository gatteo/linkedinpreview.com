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

export type ChangelogMonthGroup = {
    key: string
    label: string
    entries: ChangelogEntry[]
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

// Group newest-first entries by YYYY-MM (UTC), preserving newest-first order of
// both groups and entries within each group. Label is "Month YYYY" in UTC.
export function groupEntriesByMonth(entries: ChangelogEntry[]): ChangelogMonthGroup[] {
    const groups: ChangelogMonthGroup[] = []

    for (const entry of entries) {
        const year = entry.date.getUTCFullYear()
        const month = entry.date.getUTCMonth()
        const key = `${year}-${String(month + 1).padStart(2, '0')}`

        let group = groups.find((candidate) => candidate.key === key)

        if (!group) {
            group = {
                key,
                label: entry.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
                entries: [],
            }
            groups.push(group)
        }

        group.entries.push(entry)
    }

    return groups
}
