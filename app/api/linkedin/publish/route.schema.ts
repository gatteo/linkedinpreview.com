import { z } from 'zod'

export const bodySchema = z.object({
    draftId: z.string().min(1).max(200),
})
