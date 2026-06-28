import { z } from 'zod'

export const bodySchema = z.object({
    plan: z.enum(['monthly', 'lifetime']),
})
