import { z } from 'zod'

export const urlBodySchema = z.object({
    url: z.string().url(),
})
