import { z } from 'zod'

export const bodySchema = z.object({
    goals: z.array(z.string()),
    audience: z.array(z.string()),
    topics: z.array(z.string()),
    formats: z.array(z.string()),
    positioning: z.string(),
    recentTitles: z.array(z.string()).max(20),
})

export const ideasSchema = z.object({
    ideas: z
        .array(
            z.object({
                topic: z.string(),
                format: z.string(),
                hook: z.string(),
                reasoning: z.string(),
            }),
        )
        .min(5)
        .max(7),
})
