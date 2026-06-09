import { z } from 'zod'

const messageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    id: z.string(),
    parts: z.array(
        z
            .object({
                type: z.string(),
                text: z.string().max(10_000).optional(),
            })
            .passthrough(),
    ),
})

export const bodySchema = z.object({
    messages: z.array(messageSchema).min(1, 'At least one message is required').max(30, 'Too many messages'),
})
