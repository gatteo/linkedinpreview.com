import { z } from 'zod'

export const bodySchema = z.object({
    postText: z.string().min(1).max(10_000),
    hasImage: z.boolean(),
    hasFormatting: z.boolean(),
    contentLength: z.number().int(),
    lineCount: z.number().int(),
    hashtagCount: z.number().int(),
    emojiCount: z.number().int(),
})

export const analysisSchema = z.object({
    score: z.number().int().min(1).max(100),
    hook_score: z.number().int().min(1).max(100),
    readability_score: z.number().int().min(1).max(100),
    cta_score: z.number().int().min(1).max(100),
    engagement_score: z.number().int().min(1).max(10),
    strengths: z.array(z.string()).min(1).max(3),
    improvements: z.array(z.string()).min(1).max(3),
    topics: z.array(z.string()).min(1).max(3),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    // prettier-ignore
    category: z.enum(['thought_leadership', 'storytelling', 'educational', 'promotional', 'engagement', 'personal']),
    tone: z.enum(['professional', 'casual', 'inspirational']),
    has_hook: z.boolean(),
    has_cta: z.boolean(),
    hook_quality: z.enum(['weak', 'moderate', 'strong']),
})
