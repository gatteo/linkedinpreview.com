import { z } from 'zod'

export const bodySchema = z.object({
    role: z.string().min(1),
    goals: z.array(z.string()).min(1).max(5),
    audience: z.array(z.string()).min(1).max(7),
    topics: z.array(z.string()).min(1).max(4),
})

export const positioningSchema = z.object({
    statement: z.string(),
})
