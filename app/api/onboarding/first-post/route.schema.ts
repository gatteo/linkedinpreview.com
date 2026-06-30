import { z } from 'zod'

export const bodySchema = z.object({
    role: z.string().max(50),
    niche: z.string().max(200).optional(),
    primaryGoal: z
        .enum(['revenue-growth', 'company-awareness', 'career-opportunities', 'employer-branding', 'media-pr'])
        .optional(),
    audience: z.array(z.string().max(50)).max(7).optional(),
    tone: z.string().max(50).optional(),
    name: z.string().max(200).optional(),
    brandingContext: z.string().max(5000).optional(),
})

export const firstPostSchema = z.object({
    text: z.string(),
})
