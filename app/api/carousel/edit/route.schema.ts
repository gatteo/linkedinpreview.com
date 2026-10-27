import { z } from 'zod'

export const bodySchema = z.object({
    action: z.enum(['rewrite', 'shorten', 'punchup', 'regenerate']),
    headline: z.string().min(1).max(2_000),
    body: z.string().max(4_000).optional(),
    deckSummary: z.string().max(5_000).optional(),
    brandingContext: z.string().max(5_000).optional(),
})

export const slideSchema = z.object({
    headline: z.string(),
    body: z.string().optional(),
})

export const providerSlideSchema = slideSchema.extend({
    body: z.string().nullable(),
})

export function normalizeProviderSlide({
    body,
    ...slide
}: z.infer<typeof providerSlideSchema>): z.infer<typeof slideSchema> {
    return { ...slide, ...(body === null ? {} : { body }) }
}
