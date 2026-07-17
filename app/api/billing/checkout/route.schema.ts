import { z } from 'zod'

export const bodySchema = z.object({
    plan: z.enum(['monthly', 'lifetime']),
    // Which surface started the purchase - drives the hosted-checkout return
    // URL so the right surface resumes after the redirect.
    source: z.enum(['onboarding', 'upgrade']).default('upgrade'),
})
