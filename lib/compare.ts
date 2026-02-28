import { allComparisons } from 'contentlayer/generated'

import { Routes } from '@/config/routes'

export type ComparisonEntry = {
    slug: string
    title: string
    competitor: string
    competitorUrl: string
    summary: string
    image?: string
    createdAt: string
    modifiedAt: string
    url: string
}

export function getAllComparisons(): ComparisonEntry[] {
    return allComparisons
        .sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)))
        .map((doc) => ({
            slug: doc.slug,
            title: doc.title,
            competitor: doc.competitor,
            competitorUrl: doc.competitorUrl,
            summary: doc.summary,
            image: doc.image,
            createdAt: doc.createdAt,
            modifiedAt: doc.modifiedAt,
            url: Routes.ComparePost(doc.slug),
        }))
}

export function getComparison(slug: string) {
    return allComparisons.find((doc) => doc.slug === slug)
}
