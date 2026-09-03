import { z } from 'zod'

export const bodySchema = z.object({
    email: z.string().trim().email().max(254),
    marketingConsent: z.literal(true),
})
