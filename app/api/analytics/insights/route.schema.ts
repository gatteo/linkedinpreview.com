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

export const providerInsightsSchema = insightsSchema.extend({
    insights: z
        .array(insightSchema.extend({ action: insightSchema.shape.action.unwrap().nullable() }))
        .min(1)
        .max(6),
})

export function normalizeProviderInsights({
    insights,
    ...result
}: z.infer<typeof providerInsightsSchema>): z.infer<typeof insightsSchema> {
    return {
        ...result,
        insights: insights.map(({ action, ...insight }) => ({ ...insight, ...(action === null ? {} : { action }) })),
    }
}

export type Insight = z.infer<typeof insightSchema>
export type InsightsResult = z.infer<typeof insightsSchema>
