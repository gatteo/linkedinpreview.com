import { z } from 'zod'

import { ENTRY_SOURCES } from '@/config/entry-sources'

const monthlyOfferSchema = z.object({
    enrollmentId: z.string().uuid(),
    cohortId: z.literal('exp9_monthly_first_v2'),
    assignedVariant: z.literal('monthly_first'),
    eligibilityAt: z.string().datetime(),
    offerVersion: z.literal('monthly_first_v2'),
    entrySource: z.enum([...ENTRY_SOURCES, 'direct']),
    billingState: z.enum(['free', 'paid', 'unknown']),
    releaseSha: z.union([z.string().regex(/^[0-9a-f]{40}$/), z.literal('unavailable')]),
})

export const bodySchema = z.object({
    plan: z.enum(['monthly', 'lifetime']),
    // Which surface started the purchase - drives the hosted-checkout return
    // URL so the right surface resumes after the redirect.
    source: z.enum(['onboarding', 'upgrade']).default('upgrade'),
    monthlyOffer: monthlyOfferSchema.optional(),
})
