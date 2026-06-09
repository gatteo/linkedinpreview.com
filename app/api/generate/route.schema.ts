import { z } from 'zod'

export const bodySchema = z.object({
    action: z.enum(['hooks', 'posts', 'variation', 'shorten', 'lengthen', 'restyle', 'apply-suggestion']),
    sourceText: z.string().max(10_000).optional(),
    hook: z.string().max(2_000).optional(),
    postText: z.string().max(10_000).optional(),
    tone: z.string().max(100).optional(),
    style: z.string().max(100).optional(),
    suggestion: z.string().max(2_000).optional(),
    brandingContext: z.string().max(5_000).optional(),
})

const hooksSchema = z.object({
    hooks: z
        .array(
            z.object({
                text: z.string(),
                category: z.string(),
                type: z.string(),
            }),
        )
        .length(4),
})

const postsSchema = z.object({
    posts: z
        .array(
            z.object({
                text: z.string(),
                wordCount: z.number(),
                label: z.string(),
            }),
        )
        .length(2),
})

const resultSchema = z.object({ result: z.string() })

export const schemaMap = {
    'hooks': hooksSchema,
    'posts': postsSchema,
    'variation': resultSchema,
    'shorten': resultSchema,
    'lengthen': resultSchema,
    'restyle': resultSchema,
    'apply-suggestion': resultSchema,
} as const
