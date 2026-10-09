import { z } from 'zod'

export const bodySchema = z.object({
    source: z.enum(['topic', 'text', 'url', 'pdf']).default('topic'),
    content: z.string().min(1).max(20_000),
    carouselType: z.enum(['auto', 'listicle', 'howto', 'story', 'comparison', 'data']).default('auto'),
    targetSlides: z.number().int().min(4).max(15).default(10),
    brandingContext: z.string().max(5_000).optional(),
})

export const deckSchema = z.object({
    themeSuggestion: z
        .object({
            vibe: z.string(),
        })
        .optional(),
    slides: z
        .array(
            z.object({
                role: z.enum(['hook', 'body', 'cta']),
                headline: z.string(),
                body: z.string().optional(),
                suggestedIcon: z.string().optional(),
            }),
        )
        .min(4)
        .max(15),
})

export const providerDeckSchema = deckSchema.extend({
    themeSuggestion: deckSchema.shape.themeSuggestion.unwrap().nullable(),
    slides: z
        .array(
            deckSchema.shape.slides.element.extend({
                body: z.string().nullable(),
                suggestedIcon: z.string().nullable(),
            }),
        )
        .min(4)
        .max(15),
})

export function normalizeProviderDeck(deck: z.infer<typeof providerDeckSchema>): z.infer<typeof deckSchema> {
    return {
        ...(deck.themeSuggestion === null ? {} : { themeSuggestion: deck.themeSuggestion }),
        slides: deck.slides.map(({ body, suggestedIcon, ...slide }) => ({
            ...slide,
            ...(body === null ? {} : { body }),
            ...(suggestedIcon === null ? {} : { suggestedIcon }),
        })),
    }
}
