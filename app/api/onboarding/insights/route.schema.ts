import { z } from 'zod'

const categoryEnum = z.enum(['personal-story', 'educational', 'opinion', 'promotional', 'engagement-social', 'other'])

// The LLM only ever LABELS - every numeric field here is an index referencing a
// post in the prompt, never a count or metric. The server does all counting.
export const postsInsightsSchema = z.object({
    postLabels: z.array(z.object({ index: z.number().int().min(0), category: categoryEnum })),
    currentTopics: z.array(z.object({ topic: z.string(), postIndex: z.number().int().min(0) })).max(5),
    adjacentTopics: z.array(z.object({ topic: z.string(), why: z.string() })).max(3),
    missing: z.array(z.object({ category: categoryEnum, why: z.string() })).max(2),
    voiceTone: z.string(),
    voiceExcerpt: z.string().nullable(),
    headline: z.string(),
})

// Degraded variant: only headline/about available - no post claims allowed.
export const profileInsightsSchema = z.object({
    currentTopics: z.array(z.string()).max(5),
    adjacentTopics: z.array(z.object({ topic: z.string(), why: z.string() })).max(3),
    missing: z.array(z.object({ category: categoryEnum, why: z.string() })).max(2),
    voiceTone: z.string(),
    headline: z.string(),
})
