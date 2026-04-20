import { z } from 'zod'

export const bodySchema = z.object({
    postText: z.string().min(1).max(10_000),
})

export const suggestionsSchema = z.object({
    suggestions: z
        .array(
            z.object({
                text: z.string(),
                type: z.enum(['content', 'structure', 'tone', 'engagement']),
            }),
        )
        .length(3),
})
