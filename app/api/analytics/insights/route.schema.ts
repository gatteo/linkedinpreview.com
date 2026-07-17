import { z } from 'zod'

export const insightSchema = z.object({
    kind: z.enum(['win', 'opportunity', 'experiment', 'warning']),
    title: z.string().min(1).max(80),
    detail: z.string().min(1).max(400),
    action: z.string().max(200).optional(),
})

export const insightsSchema = z.object({
    headline: z.string().min(1).max(240),
    insights: z.array(insightSchema).min(1).max(6),
    nextPost: z.object({
        recommendation: z.string().min(1).max(400),
    }),
})

export type Insight = z.infer<typeof insightSchema>
export type InsightsResult = z.infer<typeof insightsSchema>
